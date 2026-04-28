const { formatDate } = require('../../utils/date');

const app = getApp();

Page({
  data: {
    today: formatDate(),
    newTaskTitle: '',
    tasks: [],
    streak: 0,
    lastCheckinDate: '',
    loading: false
  },

  onShow() {
    this.loadTasks();
  },

  onInputTask(e) {
    this.setData({
      newTaskTitle: e.detail.value
    });
  },

  async addTask() {
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
    await this.persist(tasks, this.data.streak, this.data.lastCheckinDate);
    this.setData({ newTaskTitle: '' });
  },

  async toggleTask(e) {
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
    await this.persist(tasks, streak, lastCheckinDate);
  },

  async deleteTask(e) {
    const taskId = Number(e.currentTarget.dataset.id);
    const tasks = this.data.tasks.filter((task) => task.id !== taskId);
    const { streak, lastCheckinDate } = this.computeStreak(tasks);
    await this.persist(tasks, streak, lastCheckinDate);
  },

  async loadTasks() {
    this.setData({ loading: true });
    try {
      const saved = await this.readProfile();
      const tasks = Array.isArray(saved.tasks) ? saved.tasks : [];

      const normalizedTasks = tasks.map((task) => ({
        ...task,
        completed: task.lastCheckinDate === this.data.today
      }));

      const { streak, lastCheckinDate } = this.computeStreak(
        normalizedTasks,
        saved.streak || 0,
        saved.lastCheckinDate || ''
      );

      this.setData({
        tasks: normalizedTasks,
        streak,
        lastCheckinDate
      });
    } catch (error) {
      console.error('加载事项失败', error);
      wx.showToast({ title: '加载失败，已回退本地模式', icon: 'none' });
      const saved = wx.getStorageSync(app.globalData.storageKey) || {};
      this.setData({
        tasks: saved.tasks || [],
        streak: saved.streak || 0,
        lastCheckinDate: saved.lastCheckinDate || ''
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async readProfile() {
    if (!app.globalData.useCloud || !wx.cloud) {
      return wx.getStorageSync(app.globalData.storageKey) || {};
    }

    const db = wx.cloud.database();
    const { data } = await db.collection(app.globalData.cloudCollection).limit(1).get();

    if (!data.length) {
      return {};
    }

    return {
      _id: data[0]._id,
      tasks: data[0].tasks || [],
      streak: data[0].streak || 0,
      lastCheckinDate: data[0].lastCheckinDate || ''
    };
  },

  async saveProfile(payload) {
    if (!app.globalData.useCloud || !wx.cloud) {
      wx.setStorageSync(app.globalData.storageKey, payload);
      return;
    }

    const db = wx.cloud.database();
    const { data } = await db.collection(app.globalData.cloudCollection).limit(1).get();

    if (data.length) {
      await db.collection(app.globalData.cloudCollection).doc(data[0]._id).update({
        data: payload
      });
      return;
    }

    await db.collection(app.globalData.cloudCollection).add({
      data: payload
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

  async persist(tasks, streak, lastCheckinDate) {
    const payload = { tasks, streak, lastCheckinDate };
    await this.saveProfile(payload);
    this.setData({ tasks, streak, lastCheckinDate });
  }
});
