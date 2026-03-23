// 允许 axios 拦截器使用 React Router navigate，避免 window.location.href 硬跳转导致的黑屏闪烁
let _navigate: ((to: string) => void) | null = null;

export function setNavigate(fn: (to: string) => void) {
  _navigate = fn;
}

export function navigateTo(to: string) {
  if (_navigate) {
    _navigate(to);
  } else {
    window.location.href = to;
  }
}
