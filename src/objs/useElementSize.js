import { ref, onMounted, onUnmounted } from 'vue'

export function useElementSize(elementRef) {
  const width = ref(0)
  const height = ref(0)

  const updateSize = () => {
    width.value = elementRef.value.clientWidth
    height.value = elementRef.value.clientHeight
  }

  const resizeObserver = new ResizeObserver(() => {
    updateSize()
  })

  onMounted(() => {
    if (elementRef.value) {
      updateSize()
      resizeObserver.observe(elementRef.value)
    }
  })

  onUnmounted(() => {
    resizeObserver.disconnect()
  })

  return { width, height }
}