import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { Input } from '../ui/input';
import { 
  File, FilePlus, FolderPlus, Trash2, Code, Hash, FileText, 
  Layout, Users, ChevronRight, ChevronDown, Download, Folder, FolderOpen,
  FileJson, FileCode, Image, Terminal
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Helper to determine language from filename
const getLanguageFromFilename = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', md: 'markdown', py: 'python',
    java: 'java', c: 'c', cpp: 'cpp', h: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust', php: 'php',
    rb: 'ruby', sql: 'sql', xml: 'xml', yaml: 'yaml', yml: 'yaml',
    sh: 'shell', bat: 'bat', dockerfile: 'dockerfile'
  };
  return map[ext] || 'plaintext';
};

// Helper to get icon
const getFileIcon = (name, type) => {
  if (type === 'folder') return <Folder className="h-4 w-4 text-blue-400" />;
  
  const ext = name.split('.').pop().toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <Code className="h-4 w-4 text-yellow-400" />;
  if (['css', 'scss', 'less'].includes(ext)) return <Hash className="h-4 w-4 text-blue-300" />;
  if (['html', 'xml'].includes(ext)) return <Layout className="h-4 w-4 text-orange-400" />;
  if (['md', 'txt'].includes(ext)) return <FileText className="h-4 w-4 text-slate-400" />;
  if (['json', 'yaml', 'yml'].includes(ext)) return <FileJson className="h-4 w-4 text-yellow-200" />;
  if (['py', 'rb', 'php', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext)) return <FileCode className="h-4 w-4 text-green-400" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return <Image className="h-4 w-4 text-purple-400" />;
  if (['sh', 'bat', 'cmd'].includes(ext)) return <Terminal className="h-4 w-4 text-slate-200" />;
  
  return <File className="h-4 w-4 text-slate-400" />;
};

const FileTreeItem = ({ item, level, onSelect, onDelete, activeFileId, expandedFolders, toggleFolder, onCreateInFolder }) => {
  const isFolder = item.type === 'folder' || item.children;
  const isExpanded = expandedFolders.has(item.path);
  const paddingLeft = `${level * 12 + 12}px`;

  return (
    <div>
      <div 
        className={`group flex items-center justify-between py-1 cursor-pointer text-sm transition-colors select-none ${
          activeFileId === item.id && !isFolder
            ? 'bg-[#37373d] text-white' 
            : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
        }`}
        style={{ paddingLeft }}
        onClick={(e) => {
          e.stopPropagation();
          if (isFolder) {
            toggleFolder(item.path);
          } else {
            onSelect(item.id);
          }
        }}
      >
        <div className="flex items-center gap-1.5 truncate flex-1">
          {isFolder && (
            <span className="text-slate-500">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          )}
          {!isFolder && <span className="w-3" />} {/* Spacer for alignment */}
          {isFolder ? (
            isExpanded ? <FolderOpen className="h-4 w-4 text-blue-400" /> : <Folder className="h-4 w-4 text-blue-400" />
          ) : (
            getFileIcon(item.name, 'file')
          )}
          <span className="truncate">{item.name}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 mr-2">
          {isFolder && (
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onCreateInFolder(item.path);
               }}
               className="text-slate-500 hover:text-white"
               title="New File in Folder"
             >
               <FilePlus className="h-3 w-3" />
             </button>
          )}
          <button 
            onClick={(e) => onDelete(item.id || item.path, e)}
            className="text-slate-500 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map(child => (
            <FileTreeItem 
              key={child.path} 
              item={child} 
              level={level + 1} 
              onSelect={onSelect} 
              onDelete={onDelete}
              activeFileId={activeFileId}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onCreateInFolder={onCreateInFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CollaborativeEditor = ({ teamId }) => {
  const { user } = useAuthContext();
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  
  // Creation State
  const [isCreating, setIsCreating] = useState(false); // 'file' | 'folder' | false
  const [newItemName, setNewItemName] = useState('');
  const [createInPath, setCreateInPath] = useState(''); // '' for root, or 'folder/'

  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const editorRef = useRef(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:85', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to coding socket');
      newSocket.emit('join_code_session', { teamId, user });
    });

    newSocket.on('init_code_session', (data) => {
      setFiles(data.files || []);
      if (data.files && data.files.length > 0) {
        // Find first file (not folder)
        const firstFile = data.files.find(f => f.type !== 'folder');
        if (firstFile) setActiveFileId(firstFile.id);
      }
    });

    newSocket.on('file_content_update', ({ fileId, content }) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
    });

    newSocket.on('file_created', (newFile) => {
      setFiles(prev => [...prev, newFile]);
    });

    newSocket.on('file_deleted', ({ fileId }) => {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (activeFileId === fileId) setActiveFileId(null);
    });

    newSocket.on('session_users', (users) => {
      setActiveUsers(users);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [teamId, user]);

  useEffect(() => {
    if (socket && activeFileId) {
      socket.emit('focus_file', { teamId, fileId: activeFileId });
    }
  }, [activeFileId, socket, teamId]);

  const handleEditorChange = (value) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value } : f));
    socket?.emit('file_update', { teamId, fileId: activeFileId, content: value });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    const fullPath = createInPath ? `${createInPath}/${newItemName}` : newItemName;
    // Remove double slashes if any
    const cleanPath = fullPath.replace(/\/+/g, '/');

    if (isCreating === 'folder') {
      socket?.emit('create_file', { teamId, name: cleanPath, type: 'folder' });
    } else {
      const lang = getLanguageFromFilename(cleanPath);
      socket?.emit('create_file', { teamId, name: cleanPath, language: lang, type: 'file' });
    }
    
    setNewItemName('');
    setIsCreating(false);
    setCreateInPath('');
  };

  const handleDeleteFile = (idOrPath, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this item?')) {
      // If it's a path (folder from tree build), we need to find all files starting with that path
      // But currently backend only supports deleting by ID.
      // For now, let's assume we pass ID for files.
      // For folders, we might need to delete all children.
      
      // Check if it's an ID in our files list
      const file = files.find(f => f.id === idOrPath);
      if (file) {
        socket?.emit('delete_file', { teamId, fileId: file.id });
      } else {
        // It's a folder path (virtual or real folder)
        // Find all files that start with this path
        const filesToDelete = files.filter(f => f.name.startsWith(idOrPath + '/'));
        filesToDelete.forEach(f => {
           socket?.emit('delete_file', { teamId, fileId: f.id });
        });
        // Also delete the folder entry itself if it exists
        const folderEntry = files.find(f => f.name === idOrPath && f.type === 'folder');
        if (folderEntry) {
           socket?.emit('delete_file', { teamId, fileId: folderEntry.id });
        }
      }
    }
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      if (file.type !== 'folder') {
        zip.file(file.name, file.content || '');
      } else {
        zip.folder(file.name);
      }
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `project-${teamId}.zip`);
  };

  // Build Tree Structure
  const fileTree = useMemo(() => {
    const tree = [];
    const map = {}; // path -> node

    // Sort files: folders first, then files, alphabetical
    const sortedFiles = [...files].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    sortedFiles.forEach(file => {
      const parts = file.name.split('/');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!map[currentPath]) {
          const newNode = {
            id: isLast ? file.id : null, // Only leaf nodes or explicit folders have IDs initially
            name: part,
            path: currentPath,
            type: isLast ? (file.type || 'file') : 'folder',
            children: isLast && file.type !== 'folder' ? null : [],
            content: isLast ? file.content : null
          };
          
          map[currentPath] = newNode;
          
          if (index === 0) {
            tree.push(newNode);
          } else {
            const parent = map[parentPath];
            if (parent) {
              // Ensure parent has children array
              if (!parent.children) parent.children = [];
              // Avoid duplicates in virtual tree
              if (!parent.children.find(c => c.name === part)) {
                parent.children.push(newNode);
              }
            }
          }
        } else if (isLast) {
            // Update existing node (e.g. created as virtual parent before) with real file data
            map[currentPath].id = file.id;
            map[currentPath].type = file.type || 'file';
            map[currentPath].content = file.content;
        }
      });
    });
    
    return tree;
  }, [files]);

  const toggleFolder = (path) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setExpandedFolders(newSet);
  };

  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#333] shadow-2xl font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#252526] border-r border-[#333] flex flex-col select-none">
        <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#252526]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explorer</span>
          <div className="flex gap-1">
            <button 
              onClick={() => { setIsCreating('file'); setCreateInPath(''); }}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-[#3c3c3c] rounded"
              title="New File"
            >
              <FilePlus className="h-4 w-4" />
            </button>
            <button 
              onClick={() => { setIsCreating('folder'); setCreateInPath(''); }}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-[#3c3c3c] rounded"
              title="New Folder"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button 
              onClick={handleDownloadProject}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-[#3c3c3c] rounded"
              title="Download Project"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="px-4 py-2 border-b border-[#333] bg-[#2a2d2e]">
              <div className="text-[10px] text-slate-400 mb-1">
                New {isCreating} {createInPath ? `in ${createInPath}` : 'at root'}
              </div>
              <div className="flex gap-1">
                <Input 
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={isCreating === 'folder' ? "folder_name" : "filename.js"}
                  className="h-6 text-xs bg-[#3c3c3c] border-[#3c3c3c] text-white focus:ring-1 focus:ring-blue-500 px-1"
                  onBlur={() => !newItemName && setIsCreating(false)}
                />
              </div>
            </form>
          )}
          
          <div className="px-0">
            {fileTree.map(item => (
              <FileTreeItem 
                key={item.path} 
                item={item} 
                level={0}
                onSelect={setActiveFileId}
                onDelete={handleDeleteFile}
                activeFileId={activeFileId}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onCreateInFolder={(path) => {
                    setCreateInPath(path);
                    setIsCreating('file');
                    setExpandedFolders(prev => new Set(prev).add(path));
                }}
              />
            ))}
          </div>
        </div>

        {/* Active Users Footer */}
        <div className="p-2 border-t border-[#333] bg-[#252526]">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 px-2">
            <Users className="h-3 w-3" />
            <span>Active Editors ({activeUsers.length})</span>
          </div>
          <div className="flex flex-wrap gap-1 px-2">
            {activeUsers.map((u, i) => (
              <div 
                key={i} 
                className="h-5 px-2 rounded bg-[#007acc] flex items-center justify-center text-[10px] text-white font-medium shadow-sm" 
                title={u.username}
              >
                {u.username}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        {/* Tabs Header */}
        <div className="flex bg-[#252526] overflow-x-auto no-scrollbar border-b border-[#1e1e1e]">
          {files.filter(f => f.type !== 'folder').map(file => (
            <div 
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer min-w-[120px] max-w-[200px] border-r border-[#1e1e1e] select-none ${
                activeFileId === file.id 
                  ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]' 
                  : 'bg-[#2d2d2d] text-slate-400 hover:bg-[#2a2d2e] border-t-2 border-t-transparent'
              }`}
            >
              {getFileIcon(file.name, 'file')}
              <span className="truncate">{file.name}</span>
            </div>
          ))}
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative overflow-hidden">
          {activeFile ? (
            <Editor
              height="100%"
              defaultLanguage={activeFile.language}
              language={activeFile.language}
              value={activeFile.content}
              theme="vs-dark"
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontLigatures: true,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Code className="h-24 w-24 mb-6 opacity-10" />
              <p className="text-lg font-medium">Select a file to start editing</p>
              <p className="text-sm mt-2 opacity-60">or create a new one from the explorer</p>
              <div className="mt-8 flex gap-4">
                <button 
                    onClick={() => setIsCreating('file')}
                    className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded text-xs text-slate-300 transition-colors"
                >
                    New File
                </button>
                <button 
                    onClick={() => setIsCreating('folder')}
                    className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded text-xs text-slate-300 transition-colors"
                >
                    New Folder
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] flex items-center px-3 text-[10px] text-white justify-between select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> Ready</span>
            {activeFile && <span>{activeFile.language}</span>}
          </div>
          <div className="flex items-center gap-4">
            <span>Ln {activeFile?.content?.split('\n').length || 0}, Col 1</span>
            <span>UTF-8</span>
            <span>{activeUsers.length} Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
