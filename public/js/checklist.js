// Default tasks - có thể để trống hoặc thêm mẫu
const defaultTasks = [];

// Load tasks from localStorage or use default
function loadTasksFromStorage() {
    try {
        const savedTasks = localStorage.getItem('fptChecklistTasks');
        if (savedTasks) {
            return JSON.parse(savedTasks);
        }
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
    }
    return [...defaultTasks];
}

// Initialize
let tasks = loadTasksFromStorage();
let filters = {
    subject: 'ALL',
    status: 'all',
    priority: 'all',
    search: ''
};

let editingTaskId = null;
let modal = null;

// Save tasks to localStorage
function saveTasksToStorage() {
    try {
        localStorage.setItem('fptChecklistTasks', JSON.stringify(tasks));
        console.log('Tasks saved successfully:', tasks);
    } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
    }
}

// Clear all tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone!')) {
        tasks = [];
        saveTasksToStorage();
        render();
    }
}

// Reset to default tasks
function resetToDefault() {
    if (confirm('Reset to default tasks? This will delete all your current tasks!')) {
        tasks = [...defaultTasks];
        saveTasksToStorage();
        render();
    }
}

// Get urgency level based on due date
function getUrgency(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'urgent';
    if (diffDays <= 7) return 'soon';
    return 'later';
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Get icon for task type
function getTypeIcon(type) {
    const icons = {
        reading: '📖',
        coding: '💻',
        practice: '✏️',
        assignment: '📝',
        exam: '🎯'
    };
    return icons[type] || '📌';
}

// Get badge class for priority
function getPriorityBadgeClass(priority) {
    const classes = {
        urgent: 'badge-priority-urgent',
        important: 'badge-priority-important',
        normal: 'badge-priority-normal'
    };
    return classes[priority] || 'badge-priority-normal';
}

// Get icon for priority
function getPriorityIcon(priority) {
    const icons = {
        urgent: '🔥',
        important: '⭐',
        normal: '📌'
    };
    return icons[priority] || '📌';
}

// Render statistics
function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && getUrgency(t.dueDate) === 'overdue').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const statsHTML = `
        <div class="col-6 col-md-4 col-lg">
            <div class="stats-card">
                <div class="stats-number text-primary">${total}</div>
                <div class="small text-muted">Total Tasks</div>
            </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
            <div class="stats-card">
                <div class="stats-number text-success">${completed}</div>
                <div class="small text-muted">Completed</div>
            </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
            <div class="stats-card">
                <div class="stats-number text-warning">${active}</div>
                <div class="small text-muted">Active</div>
            </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
            <div class="stats-card">
                <div class="stats-number text-danger">${overdue}</div>
                <div class="small text-muted">Overdue</div>
            </div>
        </div>
        <div class="col-12 col-md-4 col-lg">
            <div class="stats-card">
                <div class="stats-number text-gradient">${completionRate}%</div>
                <div class="small text-muted">Completion Rate</div>
            </div>
        </div>
    `;

    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
        statsContainer.innerHTML = statsHTML;
    }
}

// Render tasks list
function renderTasks() {
    let filteredTasks = tasks.filter(task => {
        const matchSubject = filters.subject === 'ALL' || task.subject === filters.subject;
        const matchStatus = filters.status === 'all' || 
            (filters.status === 'active' && !task.completed) ||
            (filters.status === 'completed' && task.completed) ||
            (filters.status === 'overdue' && !task.completed && getUrgency(task.dueDate) === 'overdue');
        const matchPriority = filters.priority === 'all' || task.priority === filters.priority;
        const matchSearch = filters.search === '' || 
            task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.notes.toLowerCase().includes(filters.search.toLowerCase());
        
        return matchSubject && matchStatus && matchPriority && matchSearch;
    });

    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');

    if (!tasksList || !emptyState) return;

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    const tasksHTML = filteredTasks.map(task => {
        const urgency = getUrgency(task.dueDate);
        const urgencyClass = urgency === 'overdue' ? 'overdue' : urgency === 'urgent' ? 'urgent' : '';
        const priorityBadgeClass = getPriorityBadgeClass(task.priority);
        const priorityIcon = getPriorityIcon(task.priority);
        const typeIcon = getTypeIcon(task.type);
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''} ${urgencyClass}">
                <div class="d-flex gap-3">
                    <div class="flex-shrink-0">
                        <input 
                            type="checkbox" 
                            class="checkbox-custom" 
                            ${task.completed ? 'checked' : ''}
                            onchange="toggleComplete('${task.id}')"
                        />
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="task-title ${task.completed ? 'completed' : ''}">
                                ${task.title}
                            </h6>
                            <div class="d-flex gap-2">
                                <button 
                                    class="btn btn-sm btn-link text-muted p-0" 
                                    onclick="editTask('${task.id}')"
                                    title="Edit task"
                                >
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button 
                                    class="btn btn-sm btn-link text-danger p-0" 
                                    onclick="deleteTask('${task.id}')"
                                    title="Delete task"
                                >
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="d-flex flex-wrap gap-2 mb-2">
                            <span class="badge badge-subject">${task.subject}</span>
                            <span class="badge bg-light text-dark">
                                ${typeIcon} ${task.type}
                            </span>
                            <span class="badge ${priorityBadgeClass}">
                                ${priorityIcon} ${task.priority}
                            </span>
                            <span class="badge ${urgency === 'overdue' ? 'bg-danger' : 'bg-secondary'}">
                                <i class="bi bi-calendar-event me-1"></i>
                                ${formatDate(task.dueDate)}
                                ${urgency === 'overdue' ? ' ⚠️' : ''}
                            </span>
                        </div>
                        
                        ${task.notes ? `
                            <p class="small text-muted mb-0">
                                <i class="bi bi-chat-left-text me-1"></i>
                                ${task.notes}
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    tasksList.innerHTML = tasksHTML;
}

// Main render function
function render() {
    renderStats();
    renderTasks();
}

// Toggle task completion
function toggleComplete(taskId) {
    tasks = tasks.map(task => 
        task.id === taskId 
            ? { ...task, completed: !task.completed } 
            : task
    );
    saveTasksToStorage();
    render();
}

// Edit task
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    
    const elements = {
        modalTitle: document.getElementById('modalTitle'),
        taskId: document.getElementById('taskId'),
        taskTitle: document.getElementById('taskTitle'),
        taskSubject: document.getElementById('taskSubject'),
        taskType: document.getElementById('taskType'),
        taskPriority: document.getElementById('taskPriority'),
        taskDueDate: document.getElementById('taskDueDate'),
        taskNotes: document.getElementById('taskNotes')
    };

    if (elements.modalTitle) 
        elements.modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Task';
    if (elements.taskId) 
        elements.taskId.value = task.id;
    if (elements.taskTitle) 
        elements.taskTitle.value = task.title;
    if (elements.taskSubject) 
        elements.taskSubject.value = task.subject;
    if (elements.taskType) 
        elements.taskType.value = task.type;
    if (elements.taskPriority) 
        elements.taskPriority.value = task.priority;
    if (elements.taskDueDate) 
        elements.taskDueDate.value = task.dueDate;
    if (elements.taskNotes) 
        elements.taskNotes.value = task.notes;

    if (modal) 
        modal.show();
}

// Delete task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToStorage();
    render();
}

// Save task
function saveTask() {
    const taskIdEl = document.getElementById('taskId');
    const taskTitleEl = document.getElementById('taskTitle');
    
    if (!taskTitleEl) return;
    
    const taskId = taskIdEl ? taskIdEl.value : '';
    const title = taskTitleEl.value.trim();

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    const task = {
        id: taskId || Date.now().toString(),
        title: title,
        subject: document.getElementById('taskSubject')?.value || 'LAB211',
        type: document.getElementById('taskType')?.value || 'reading',
        priority: document.getElementById('taskPriority')?.value || 'normal',
        dueDate: document.getElementById('taskDueDate')?.value || new Date().toISOString().split('T')[0],
        notes: document.getElementById('taskNotes')?.value.trim() || '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    if (taskId) {
        tasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...task, completed: t.completed, createdAt: t.createdAt };
            }
            return t;
        });
    } else {
        tasks.push(task);
    }

    if (modal) modal.hide();
    resetForm();
    saveTasksToStorage();
    render();
}

function resetForm() {
    editingTaskId = null;
    
    const elements = {
        taskId: document.getElementById('taskId'),
        taskTitle: document.getElementById('taskTitle'),
        taskSubject: document.getElementById('taskSubject'),
        taskType: document.getElementById('taskType'),
        taskPriority: document.getElementById('taskPriority'),
        taskNotes: document.getElementById('taskNotes'),
        taskDueDate: document.getElementById('taskDueDate'),
        modalTitle: document.getElementById('modalTitle')
    };

    if (elements.taskId) 
        elements.taskId.value = '';
    if (elements.taskTitle) 
        elements.taskTitle.value = '';
    if (elements.taskSubject) 
        elements.taskSubject.value = 'LAB211';
    if (elements.taskType) 
        elements.taskType.value = 'reading';
    if (elements.taskPriority) 
        elements.taskPriority.value = 'normal';
    if (elements.taskNotes) 
        elements.taskNotes.value = '';
    if (elements.taskDueDate) 
        elements.taskDueDate.value = new Date().toISOString().split('T')[0];
    if (elements.modalTitle)
        elements.modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Task';
}

document.addEventListener('DOMContentLoaded', function() {
    const taskModalEl = document.getElementById('taskModal');
    if (taskModalEl && typeof bootstrap !== 'undefined') {
        modal = new bootstrap.Modal(taskModalEl);
    }
    
    const taskDueDateEl = document.getElementById('taskDueDate');
    if (taskDueDateEl) {
        taskDueDateEl.value = new Date().toISOString().split('T')[0];
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filters.search = e.target.value;
            render();
        });
    }

    const saveTaskBtn = document.getElementById('saveTaskBtn');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', saveTask);
    }

    if (taskModalEl) {
        taskModalEl.addEventListener('hidden.bs.modal', resetForm);
    }

    render();
});

window.toggleComplete = toggleComplete;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.clearAllTasks = clearAllTasks;
window.resetToDefault = resetToDefault;