
import type { IPluginContext, TaroPlatformBase } from '@tarojs/service'
import { isArray, isString } from '@tarojs/shared'
import { isHtmlTags } from './utils'

interface IOptions {
  pxtransformBlackList: any[]
}

interface OnParseCreateElementArgs {
  nodeName: string
  componentConfig: {
    includes: Set<string>
  }
}

export default (ctx: IPluginContext, options: IOptions) => {
  ctx.registerMethod({
    name: 'onSetupClose',
    fn (platform: TaroPlatformBase) {
      injectRuntimePath(platform)
      modifyPostcssConfigs(platform, options)
    }
  })
  // React 收集使用到的小程序组件
  ctx.onParseCreateElement(({ nodeName, componentConfig }: OnParseCreateElementArgs) => {
    if (!isHtmlTags(nodeName)) return

    const simple = ['audio', 'button', 'canvas', 'form', 'label', 'progress', 'textarea', 'video']
    const special = {
      a: ['navigator'],
      iframe: ['web-view'],
      img: ['image'],
      input: ['input', 'checkbox', 'radio']
    }
    const includes = componentConfig.includes

    if (simple.includes(nodeName) && !includes.has(nodeName)) {
      includes.add(nodeName)
    } else if (nodeName in special) {
      const maps = special[nodeName]
      maps.forEach(item => {
        !includes.has(item) && includes.add(item)
      })
    }
  })
}

function injectRuntimePath (platform: TaroPlatformBase) {
  const injectedPath = '@tarojs/plugin-html/dist/runtime'
  if (isArray(platform.runtimePath)) {
    platform.runtimePath.push(injectedPath)
  } else if (isString(platform.runtimePath)) {
    platform.runtimePath = [platform.runtimePath, injectedPath]
  }
}

function modifyPostcssConfigs (platform: TaroPlatformBase, options: IOptions) {
  platform.config.postcss ||= {}
  const postcssConfig = platform.config.postcss

  postcssConfig.htmltransform = {
    enable: true
  }

  const pxtransformConfig = postcssConfig.pxtransform

  if (pxtransformConfig?.enable && options.pxtransformBlackList) {
    pxtransformConfig.config ||= {}
    const config = pxtransformConfig.config
    config.selectorBlackList ||= []
    config.selectorBlackList = config.selectorBlackList.concat(options.pxtransformBlackList)
  }
}