// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './index.css'
import customComponents from '../components'
import { ID_INJECTION_KEY } from 'element-plus'


export default {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    ctx.app.use(ElementPlus)
    ctx.app.provide(ID_INJECTION_KEY, {
        prefix: 1024,
        current: 0,
    })
    for(const name in customComponents){
        ctx.app.component(name,customComponents[name])
    }
  }
}