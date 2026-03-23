import { useEffect, useState, type FormEvent } from 'react';

import { createProject, deleteProject, getProjects, type Project } from '../api';

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
      console.error('\u52a0\u8f7d\u9879\u76ee\u5931\u8d25:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject({ name: newProjectName });
      setNewProjectName('');
      loadProjects();
    } catch (error) {
      console.error('\u521b\u5efa\u9879\u76ee\u5931\u8d25:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('\u786e\u5b9a\u5220\u9664\u6b64\u9879\u76ee\uff1f')) return;
    try {
      await deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error('\u5220\u9664\u9879\u76ee\u5931\u8d25:', error);
    }
  };

  if (loading) return <div>{'\u52a0\u8f7d\u4e2d...'}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>{'\u6211\u7684\u9879\u76ee'}</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="\u9879\u76ee\u540d\u79f0"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit">{'\u521b\u5efa\u9879\u76ee'}</button>
      </form>

      <div>
        {projects.length === 0 ? (
          <p>{'\u6682\u65e0\u9879\u76ee'}</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
            >
              <h3>{project.name}</h3>
              <p>{'\u72b6\u6001'}: {project.status}</p>
              <p>{'\u521b\u5efa\u65f6\u95f4'}: {new Date(project.created_at).toLocaleString()}</p>
              <button onClick={() => handleDelete(project.id)}>{'\u5220\u9664'}</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
