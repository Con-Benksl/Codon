"""统一的生物数据库异步客户端 + SQLite 缓存层。

本模块为 Designer 流程提供对外部生物数据源的统一查询入口，
所有函数均为异步、容错（异常吞掉返回 None），并通过本地 SQLite
缓存（TTL 7 天）减少重复网络请求。

支持的数据源：
- UniProt REST:   https://rest.uniprot.org/uniprotkb/{id}.json
- NCBI E-utils:   https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi
- KEGG REST:      https://rest.kegg.jp/get/{entry_id}
- BRENDA SOAP:    暂未实现（stub），后期通过 SOAP 接入

缓存：
- 文件：backend/gene_query_cache.db
- 表：cache(key TEXT PRIMARY KEY, value TEXT, created_at REAL)
- key 格式：{source}:{query}，例如 "uniprot:P0CNB5"
- TTL：604800 秒（7 天）

NCBI 使用全局锁限制频率，确保两次请求间隔 ≥ 0.34 秒（3 req/s 安全线）。
"""
from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import time
from typing import Optional

import httpx

# ---------- 常量 ----------

_CACHE_TTL_SECONDS: float = 7 * 24 * 60 * 60  # 604800
_HTTP_TIMEOUT: float = 30.0
_NCBI_MIN_INTERVAL: float = 0.34  # 秒，约 3 req/s

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_CACHE_DB_PATH = os.path.join(_BASE_DIR, "gene_query_cache.db")

# ---------- NCBI 速率限制 ----------

_ncbi_lock: asyncio.Lock = asyncio.Lock()
_ncbi_last_call: float = 0.0


# ---------- SQLite 缓存 ----------

def _ensure_cache_table() -> None:
    """惰性创建缓存表。"""
    conn = sqlite3.connect(_CACHE_DB_PATH)
    try:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS cache ("
            "key TEXT PRIMARY KEY, "
            "value TEXT, "
            "created_at REAL)"
        )
        conn.commit()
    finally:
        conn.close()


def _cache_get(key: str) -> Optional[str]:
    """读取缓存值；若未命中或已过期返回 None。"""
    try:
        _ensure_cache_table()
        conn = sqlite3.connect(_CACHE_DB_PATH)
        try:
            cur = conn.execute(
                "SELECT value, created_at FROM cache WHERE key = ?", (key,)
            )
            row = cur.fetchone()
        finally:
            conn.close()
        if row is None:
            return None
        value, created_at = row
        if (time.time() - float(created_at)) > _CACHE_TTL_SECONDS:
            return None
        return value  # type: ignore[no-any-return]
    except Exception:
        return None


def _cache_set(key: str, value: str) -> None:
    """写入缓存；失败静默。"""
    try:
        _ensure_cache_table()
        conn = sqlite3.connect(_CACHE_DB_PATH)
        try:
            conn.execute(
                "INSERT OR REPLACE INTO cache (key, value, created_at) VALUES (?, ?, ?)",
                (key, value, time.time()),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


# ---------- 内部工具 ----------

async def _ncbi_throttle() -> None:
    """确保两次 NCBI 调用之间至少间隔 _NCBI_MIN_INTERVAL 秒。"""
    global _ncbi_last_call
    now = time.monotonic()
    delta = now - _ncbi_last_call
    if delta < _NCBI_MIN_INTERVAL:
        await asyncio.sleep(_NCBI_MIN_INTERVAL - delta)
    _ncbi_last_call = time.monotonic()


# ---------- 公共 API ----------

async def fetch_uniprot_entry(uniprot_id: str) -> Optional[dict]:
    """查询 UniProt 单条蛋白条目（JSON）。"""
    cache_key = f"uniprot:{uniprot_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        try:
            return json.loads(cached)
        except Exception:
            pass

    url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.json"
    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()
    except Exception:
        return None

    try:
        _cache_set(cache_key, json.dumps(data, ensure_ascii=False))
    except Exception:
        pass
    return data  # type: ignore[no-any-return]


async def fetch_ncbi_gene_summary(gene_id: str) -> Optional[dict]:
    """查询 NCBI Gene esummary（JSON）。受全局速率锁约束。"""
    cache_key = f"ncbi_gene:{gene_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        try:
            return json.loads(cached)
        except Exception:
            pass

    url = (
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        f"?db=gene&id={gene_id}&retmode=json"
    )
    try:
        async with _ncbi_lock:
            await _ncbi_throttle()
            async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
                resp = await client.get(url)
        if resp.status_code != 200:
            return None
        data = resp.json()
    except Exception:
        return None

    try:
        _cache_set(cache_key, json.dumps(data, ensure_ascii=False))
    except Exception:
        pass
    return data  # type: ignore[no-any-return]


async def fetch_kegg_entry(entry_id: str) -> Optional[str]:
    """查询 KEGG 条目（纯文本 flat-file）。"""
    cache_key = f"kegg:{entry_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        # KEGG 缓存以 JSON 字符串形式包装文本，便于与 dict 类型一致处理
        try:
            return json.loads(cached)
        except Exception:
            return cached

    url = f"https://rest.kegg.jp/get/{entry_id}"
    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            text = resp.text
    except Exception:
        return None

    try:
        _cache_set(cache_key, json.dumps(text, ensure_ascii=False))
    except Exception:
        pass
    return text


async def fetch_brenda_kinetics(ec_number: str) -> Optional[dict]:
    """查询 BRENDA 动力学参数。

    TODO: BRENDA 官方接口为 SOAP（zeep），需要注册账号 + 密码 hash，
    后期阶段接入。当前为 stub，始终返回 None。
    """
    return None
