import { defineConfig } from 'vitepress'
import hookConfig from '../hooks.js'
import utilsConfig from '../utils.js'
import interfacesConfig from '../interfaces.js'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: "tspress 文档",
  description: "点击开始查看你的文档",
  themeConfig: {    
    nav: [
      {
        text: 'hooks',
        link: hookConfig.link,
        activeMatch: '/hooks/'
      },
      {
        text: '工具函数',
        link: utilsConfig.link,
        activeMatch: '/utils/'
      },
      {
        text: '接口',
        link: interfacesConfig.link,
        activeMatch: '/interfaces/'
      }
    ],

    sidebar: {
      '/hooks/': [
        {
          text: '组合式api',
          items: hookConfig.item 
        },
      ],
      '/utils/': [
        {
          text: '工具函数',
          items: utilsConfig.item 
        }
      ],
      '/interfaces/': [
        {
          text: '接口定义',
          items: interfacesConfig.item 
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shiouhoo/quick-tsdoc' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present shiouhoo'
    }

  }
})
