import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import HomeView from './shell/HomeView.vue';
import SectionView from './shell/SectionView.vue';
import { overLimit } from './shell/session';
import './styles/base.css';

const router = createRouter({
  // hash 模式：静态托管无需配置重写规则
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/s/:id', name: 'section', component: SectionView, props: true },
    { path: '/play/:id', name: 'play', component: () => import('./shell/PlayView.vue'), props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

// 超时后不允许进入活动
router.beforeEach((to) => (to.name === 'play' && overLimit() ? { name: 'home' } : true));

createApp(App).use(router).mount('#app');
