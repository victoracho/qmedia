export default {
  //Home Page
  index: {
    permission: 'media.medias.manage',
    activated: true,
    path: '/media/index',
    name: 'app.media.index',
    page: () => import('@imagina/qmedia/_pages/admin/index'),
    layout: () => import('@imagina/qsite/_layouts/master.vue'),
    title: 'qmedia.sidebar.adminIndex',
    icon: 'fas fa-photo-video',
    authenticated: true,
    subHeader : {
      refresh : true
    }
  },
}
