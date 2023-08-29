import { defineConfig } from 'vitepress'
import hookConfig from '../hooks.js'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "hooks 文档",
  description: "点击开始查看你的文档",

  themeConfig: {
    nav: [
      {
        text: 'hooks',
        link: '/hooks/',
        activeMatch: '/hooks/'
      }
    ],

    sidebar: {
      '/hooks/': [
        {
          text: '组合式api',
          items: hookConfig.item 
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shiouhoo/hooui' }
    ]
  }
})
