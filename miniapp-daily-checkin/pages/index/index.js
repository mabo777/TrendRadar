const { formatDate } = require('../../utils/date');

const app = getApp();

Page({
  data: {
    today: formatDate(),
    newTaskTitle: '',
    tasks: [],
    streak: 0,
    lastCheckinDate: '',
    checkinHistory: [],
    reminder: {
      enabled: false,
      time: '21:00'
    },
    monthLabel: '',
    calendarDays: [],
    monthCompletionRate: 0,
    loading: false,
    openid: ''
  },

  async onShow() {
    await this.loadTasks();
  },

  onInputTask(e) {
    this.setData({ newTaskTitle: e.detail.value });
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
    await this.persist(tasks, this.data.streak, this.data.lastCheckinDate, this.data.checkinHistory, this.data.reminder);
    this.setData({ newTaskTitle: '' });
  },

  async toggleTask(e) {
    const taskId = Number(e.currentTarget.dataset.id);
    const today = this.data.today;

    const tasks = this.data.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const completed = !task.completed;
      return { ...task, completed, lastCheckinDate: completed ? today : '' };
    });

    const { streak, lastCheckinDate, checkinHistory } = this.computeStreak(tasks, this.data.checkinHistory);
    await this.persist(tasks, streak, lastCheckinDate, checkinHistory, this.data.reminder);
  },

  async deleteTask(e) {
    const taskId = Number(e.currentTarget.dataset.id);
    const tasks = this.data.tasks.filter((task) => task.id !== taskId);
    const { streak, lastCheckinDate, checkinHistory } = this.computeStreak(tasks, this.data.checkinHistory);
    await this.persist(tasks, streak, lastCheckinDate, checkinHistory, this.data.reminder);
  },

  async requestReminderPermission() {
    const templateIds = app.globalData.templateIds || [];
    if (!templateIds.length || templateIds[0].includes('请替换')) {
      wx.showToast({ title: '请先配置订阅模板ID', icon: 'none' });
      return;
    }

    try {
      const result = await wx.requestSubscribeMessage({ tmplIds: templateIds });
      const granted = templateIds.some((id) => result[id] === 'accept');
      const reminder = { ...this.data.reminder, enabled: granted };
      await this.persist(this.data.tasks, this.data.streak, this.data.lastCheckinDate, this.data.checkinHistory, reminder);
      wx.showToast({ title: granted ? '已开启提醒' : '未授权提醒', icon: 'none' });
    } catch (error) {
      console.error('订阅消息授权失败', error);
      wx.showToast({ title: '授权失败', icon: 'none' });
    }
  },

  async loadTasks() {
    this.setData({ loading: true });
    try {
      const openid = await this.loadOpenid();
      const saved = await this.readProfile();
      const tasks = Array.isArray(saved.tasks) ? saved.tasks : [];
      const checkinHistory = Array.isArray(saved.checkinHistory) ? saved.checkinHistory : [];

      const normalizedTasks = tasks.map((task) => ({
        ...task,
        completed: task.lastCheckinDate === this.data.today
      }));

      const { streak, lastCheckinDate, checkinHistory: mergedHistory } = this.computeStreak(
        normalizedTasks,
        checkinHistory,
        saved.streak || 0,
        saved.lastCheckinDate || ''
      );

      const reminder = saved.reminder || this.data.reminder;
      const calendar = this.buildCalendar(mergedHistory);

      this.setData({
        openid,
        tasks: normalizedTasks,
        streak,
        lastCheckinDate,
        checkinHistory: mergedHistory,
        reminder,
        monthLabel: calendar.monthLabel,
        calendarDays: calendar.days,
        monthCompletionRate: calendar.completionRate
      });
    } catch (error) {
      console.error('加载事项失败', error);
      wx.showToast({ title: '加载失败，已回退本地模式', icon: 'none' });
      const saved = wx.getStorageSync(app.globalData.storageKey) || {};
      const calendar = this.buildCalendar(saved.checkinHistory || []);
      this.setData({
        tasks: saved.tasks || [],
        streak: saved.streak || 0,
        lastCheckinDate: saved.lastCheckinDate || '',
        checkinHistory: saved.checkinHistory || [],
        reminder: saved.reminder || this.data.reminder,
        monthLabel: calendar.monthLabel,
        calendarDays: calendar.days,
        monthCompletionRate: calendar.completionRate
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadOpenid() {
    if (!app.globalData.useCloud || !wx.cloud) return '';

    const result = await wx.cloud.callFunction({
      name: app.globalData.functionNames.login
    });
    return result.result.openid;
  },

  async readProfile() {
    if (!app.globalData.useCloud || !wx.cloud) {
      return wx.getStorageSync(app.globalData.storageKey) || {};
    }

    const result = await wx.cloud.callFunction({
      name: app.globalData.functionNames.profile,
      data: { action: 'get' }
    });

    return (result.result && result.result.profile) || {};
  },

  async saveProfile(payload) {
    if (!app.globalData.useCloud || !wx.cloud) {
      wx.setStorageSync(app.globalData.storageKey, payload);
      return;
    }

    const result = await wx.cloud.callFunction({
      name: app.globalData.functionNames.profile,
      data: {
        action: 'save',
        payload
      }
    });

    if (!result.result || !result.result.ok) {
      throw new Error('云端保存失败');
    }
  },

  computeStreak(tasks, baseHistory = [], baseStreak = 0, baseLastDate = '') {
    const today = this.data.today;
    const allDoneToday = tasks.length > 0 && tasks.every((task) => task.lastCheckinDate === today);
    const historySet = new Set(baseHistory);

    if (allDoneToday) {
      historySet.add(today);
      if (baseLastDate === today) {
        return { streak: baseStreak, lastCheckinDate: today, checkinHistory: [...historySet] };
      }

      const yesterday = this.getOffsetDate(today, -1);
      const nextStreak = baseLastDate === yesterday ? baseStreak + 1 : 1;
      return { streak: nextStreak, lastCheckinDate: today, checkinHistory: [...historySet] };
    }

    return { streak: baseStreak, lastCheckinDate: baseLastDate, checkinHistory: [...historySet] };
  },

  buildCalendar(checkinHistory) {
    const now = new Date(`${this.data.today}T00:00:00`);
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthLabel = `${year}年${month + 1}月`;
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i += 1) {
      days.push({ key: `blank-${i}`, day: '', checked: false, isBlank: true });
    }

    let checkedCount = 0;
    for (let d = 1; d <= totalDays; d += 1) {
      const date = formatDate(new Date(year, month, d));
      const checked = checkinHistory.includes(date);
      if (checked) checkedCount += 1;
      days.push({ key: date, day: d, checked, isBlank: false });
    }

    return {
      monthLabel,
      days,
      completionRate: Math.round((checkedCount / totalDays) * 100)
    };
  },

  getOffsetDate(dateText, offsetDays) {
    const date = new Date(`${dateText}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);
    return formatDate(date);
  },

  async persist(tasks, streak, lastCheckinDate, checkinHistory, reminder) {
    const calendar = this.buildCalendar(checkinHistory);
    const payload = { tasks, streak, lastCheckinDate, checkinHistory, reminder };
    await this.saveProfile(payload);
    this.setData({
      tasks,
      streak,
      lastCheckinDate,
      checkinHistory,
      reminder,
      monthLabel: calendar.monthLabel,
      calendarDays: calendar.days,
      monthCompletionRate: calendar.completionRate
    });
  }
});
