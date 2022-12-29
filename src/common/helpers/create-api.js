import { render, createVNode, mergeProps } from 'vue'

let seed = 0
const instances = []

const createComponent = (componentCtor, options) => {
  const container = document ? document.createElement('div') : null
  const id = 'cube_create_component_' + seed++
  const vm = createVNode(componentCtor, {
    ...options,
    id
  })

  instances.push(vm)

  if (container) {
    // mounted component
    render(vm, container)

    // add remove vm
    vm.component.proxy['$remove'] = function(cb) {
      render(null, container)
      cb && cb()
      if (container && document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }

    // add $updateProps
    vm.component.proxy['$updateProps'] = function(props) {
      // reset default value
      Object.keys(componentCtor.props).forEach(key => {
        vm.component.props[key] = componentCtor.props[key].default
      })
      // set new props
      Object.keys(props).forEach(key => {
        vm.component.props[key] = props[key]
      })
    }

    document.body.appendChild(container)
  }

  return vm
}

export default function createAPI(app, Component, events, single) {
  app.config.globalProperties[`$create${Component.name.replace('cube-', '').replace(/^\w/, ($) => $.toUpperCase())}`] = function(options) {
    if (single && Component._instance) {
      if (options) {
        Component._instance.component.proxy.$updateProps(options)
      }
      return Component._instance.component.proxy
    }
    const vm = Component._instance = createComponent(Component, options)

    const parentVnodeProps = this ? this._.vnode.props : null
    if (parentVnodeProps) {
      this._.vnode.props = mergeProps(parentVnodeProps || {}, {
        onVnodeBeforeUnmount() {
          vm.component.proxy.$remove()
        }
      })
    }

    return vm.component.proxy
  }
}
