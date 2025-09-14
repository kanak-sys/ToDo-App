/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:3000';

export default function App() {
  const [page, setPage] = useState('landing');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [todos, setTodos] = useState([]);
  const [todoForm, setTodoForm] = useState({ title: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (token) {
      fetchTodos();
    }
  }, [token]);
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(res.data);
      setPage('todos');
    } catch (err) {
      // Don't show error for empty todos - it's normal for new users
      if (err.response && err.response.status !== 404) {
        showMessage('Failed to fetch todos', 'error');
      }
      setTodos([]);
      setPage('todos');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/auth/${mode}`;
      const payload =
        mode === 'signup'
          ? form
          : { email: form.email, password: form.password };

      const res = await axios.post(url, payload);
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      showMessage(`Welcome ${res.data.user.username || res.data.user.email}!`, 'success');
      
      // Fetch todos after successful auth
      await fetchTodos();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      setUser(null);
      setToken('');
      setPage('landing');
      showMessage('Logged out successfully', 'success');
    }
  };

  const handleAddTodo = async () => {
    if (!todoForm.title.trim()) {
      showMessage('Todo title cannot be empty', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/todos`, todoForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos([...todos, res.data]);
      setTodoForm({ title: '', description: '' });
      showMessage('Todo added successfully', 'success');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to add todo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async (id) => {
    setLoading(true);
    try {
      const todo = todos.find((t) => t.id === id);
      const res = await axios.put(`${API_BASE}/todos/${id}`, todo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(todos.map((t) => (t.id === id ? res.data : t)));
      setEditing(null);
      showMessage('Todo updated successfully', 'success');
    } catch (err) {
      showMessage('Failed to update todo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE}/todos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTodos(todos.filter((t) => t.id !== id));
        showMessage('Todo deleted successfully', 'success');
      } catch (err) {
        showMessage('Failed to delete todo', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleComplete = async (t) => {
    try {
      const res = await axios.put(
        `${API_BASE}/todos/${t.id}`,
        { ...t, completed: !t.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodos(todos.map((x) => (x.id === t.id ? res.data : x)));
      showMessage(`Todo marked as ${!t.completed ? 'complete' : 'incomplete'}`, 'success');
    } catch {
      showMessage('Failed to update todo status', 'error');
    }
  };

  if (page === 'landing') {
    return (
      <div className="container">
        <div className="landing-page">
          <div className="card">
            <h1>Welcome to Todo App</h1>
            <p>Organize your tasks and boost your productivity</p>
            <button className="btn-primary" onClick={() => setPage('auth')}>
              Get Started
            </button>
          </div>
        </div>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  if (page === 'auth') {
    return (
      <div className="container">
        <div className="auth-page">
          <div className="card">
            <h2>{mode === 'login' ? 'Login' : 'Create Account'}</h2>
            {mode === 'signup' && (
              <input
                className="input-field"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            )}
            <input
              className="input-field"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button 
              className="btn-primary" 
              onClick={handleAuth}
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Signup'}
            </button>
            <p className="auth-switch">
              {mode === 'login' ? 'No account?' : 'Already have an account?'}{' '}
              <span onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </span>
            </p>
          </div>
        </div>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="todos-page">
        <header className="header">
          <h1>Your Todo List</h1>
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="add-todo-form">
          <h2>Add New Todo</h2>
          <div className="form-group">
            <input
              className="input-field"
              placeholder="Title"
              value={todoForm.title}
              onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Description (optional)"
              value={todoForm.description}
              onChange={(e) =>
                setTodoForm({ ...todoForm, description: e.target.value })
              }
            />
            <button 
              className="btn-primary" 
              onClick={handleAddTodo}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Todo'}
            </button>
          </div>
        </div>

        <div className="todos-container">
          <h2>Your Todos ({todos.length})</h2>
          {loading && <div className="loading">Loading...</div>}
          
          {!loading && todos.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any todos yet.</p>
              <p>Add a new todo to get started!</p>
            </div>
          ) : (
            <div className="todos-list">
              {todos.map((t) => (
                <div key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                  <div className="todo-checkbox">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleComplete(t)}
                      id={`todo-${t.id}`}
                    />
                    <label htmlFor={`todo-${t.id}`}></label>
                  </div>
                  
                  <div className="todo-content">
                    {editing === t.id ? (
                      <div className="edit-form">
                        <input
                          className="input-field"
                          value={t.title}
                          onChange={(e) =>
                            setTodos(
                              todos.map((x) =>
                                x.id === t.id ? { ...x, title: e.target.value } : x
                              )
                            )
                          }
                        />
                        <input
                          className="input-field"
                          value={t.description}
                          onChange={(e) =>
                            setTodos(
                              todos.map((x) =>
                                x.id === t.id
                                  ? { ...x, description: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                        <div className="todo-actions">
                          <button 
                            className="btn-success" 
                            onClick={() => handleUpdateTodo(t.id)}
                          >
                            Save
                          </button>
                          <button 
                            className="btn-secondary" 
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="todo-text">
                          <h3>{t.title}</h3>
                          {t.description && <p>{t.description}</p>}
                        </div>
                        <div className="todo-actions">
                          <button 
                            className="btn-secondary"
                            onClick={() => setEditing(t.id)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-danger"
                            onClick={() => handleDeleteTodo(t.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}