const { formatDate } = require('../../utils/date');

const app = getApp();

Page({
  data: {
    today: formatDate(),
    newTaskTitle: '',
    tasks: [],
    streak: 0,
    lastCheckinDate: ''
  },

  onShow() {
    this.loadTasks();
  },

  onInputTask(e) {
    this.setData({
      newTaskTitle: e.detail.value
    });
  },

  addTask() {
    const title = this.data.newTaskTitle.trim();
    if (!title) {
      wx.showToast({ title: '请先输入事项', icon: 'none' });
      return;
    }

    const task = {
      id: Date.now(),
      title,
      completed: false,
      lastCheckinDate: ''
    };

    const tasks = [task, ...this.data.tasks];
    this.persist(tasks, this.data.streak, this.data.lastCheckinDate);
    this.setData({ newTaskTitle: '' });
  },

  toggleTask(e) {
    const taskId = Number(e.currentTarget.dataset.id);
    const today = this.data.today;

    const tasks = this.data.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const completed = !task.completed;
      return {
        ...task,
        completed,
        lastCheckinDate: completed ? today : ''
      };
    });

    const { streak, lastCheckinDate } = this.computeStreak(tasks);
    this.persist(tasks, streak, lastCheckinDate);
  },

  deleteTask(e) {
    const taskId = Number(e.currentTarget.dataset.id);
    const tasks = this.data.tasks.filter((task) => task.id !== taskId);
    const { streak, lastCheckinDate } = this.computeStreak(tasks);
    this.persist(tasks, streak, lastCheckinDate);
  },

  loadTasks() {
    const saved = wx.getStorageSync(app.globalData.storageKey) || {};
    const tasks = Array.isArray(saved.tasks) ? saved.tasks : [];

    const normalizedTasks = tasks.map((task) => ({
      ...task,
      completed: task.lastCheckinDate === this.data.today
    }));

    const { streak, lastCheckinDate } = this.computeStreak(normalizedTasks, saved.streak || 0, saved.lastCheckinDate || '');

    this.setData({
      tasks: normalizedTasks,
      streak,
      lastCheckinDate
    });
  },

  computeStreak(tasks, baseStreak = 0, baseLastDate = '') {
    const today = this.data.today;
    const allDoneToday = tasks.length > 0 && tasks.every((task) => task.lastCheckinDate === today);

    if (allDoneToday) {
      if (baseLastDate === today) {
        return { streak: baseStreak, lastCheckinDate: today };
      }

      const yesterday = this.getOffsetDate(today, -1);
      const nextStreak = baseLastDate === yesterday ? baseStreak + 1 : 1;
      return { streak: nextStreak, lastCheckinDate: today };
    }

    return { streak: baseStreak, lastCheckinDate: baseLastDate };
  },

  getOffsetDate(dateText, offsetDays) {
    const date = new Date(`${dateText}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);
    return formatDate(date);
  },

  persist(tasks, streak, lastCheckinDate) {
    const payload = { tasks, streak, lastCheckinDate };
    wx.setStorageSync(app.globalData.storageKey, payload);
    this.setData({ tasks, streak, lastCheckinDate });
  }
});
