App({
  globalData: {
    storageKey: 'daily_checkin_tasks_v1',
    useCloud: false,
    cloudEnvId: '请替换为你的云环境ID',
    cloudCollection: 'daily_checkin_profiles'
  },

  onLaunch() {
    if (!wx.cloud) {
      console.warn('当前基础库不支持云能力，将自动使用本地存储模式');
      return;
    }

    if (!this.globalData.useCloud) {
      return;
    }

    wx.cloud.init({
      env: this.globalData.cloudEnvId,
      traceUser: true
    });
  }
});
