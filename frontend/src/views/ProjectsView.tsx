import { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject, type Project } from '../api';

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject({ name: newProjectName });
      setNewProjectName('');
      loadProjects();
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此项目?')) return;
    try {
      await deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error('删除项目失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>我的项目</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="项目名称"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit">创建项目</button>
      </form>

      <div>
        {projects.length === 0 ? (
          <p>暂无项目</p>
        ) : (
          projects.map((project) => (
            <div key={project.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <h3>{project.name}</h3>
              <p>状态: {project.status}</p>
              <p>创建时间: {new Date(project.created_at).toLocaleString()}</p>
              <button onClick={() => handleDelete(project.id)}>删除</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
