import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'

export function useCommonProps() {
  const MEvent = {
    Clicked: 0,
    Selected: 1,
    Hovered: 2,
    None: 3,
  };

  const MEventSource = {
    Heatmap: 0,
    Network: 1,
    ParallelCoordinates: 2,
    Other: 3,
  };

  const store = useStore()
  // order[i] : the element id at position i
  const order = computed(() => store.getters.getOrder);
  const hover = computed(() => store.getters.getHover);
  const selection = computed(() => store.getters.getSelection);
  const clicked = computed(() => store.getters.getClicked);
  const dropIndices = computed(() => store.getters.getDropIndices);
  const nLimit = computed(() => store.getters.getNLimit);
  //const filteredOrder  = computed(() => {
  //  return {
  //    var: order.value.var.filter(d => dropIndices.value.var.indexOf(d) == -1),
  //    factor: order.value.factor.filter(d => dropIndices.value.factor.indexOf(d) == -1)
  //  };
  //});

  const varCond = i => {
    if (typeof clicked.value.var == "number" && clicked.value.var == i) return MEvent.Clicked;
    if (selection.value.var && selection.value.var.has(i)) return MEvent.Selected;
    if (typeof hover.value.var == "number" && hover.value.var == i) return MEvent.Hovered;
    return MEvent.None;
  };

  const factorCond = i => {
    if (typeof clicked.value.factor == "number" && clicked.value.factor == i) return MEvent.Clicked;
    if (selection.value.factor && selection.value.factor.has(i)) return MEvent.Selected;
    if (typeof hover.value.factor == "number" && hover.value.factor == i) return MEvent.Hovered;
    return MEvent.None;
  };

  const filterOrder = (ord, dind) => ord.filter(x => dind.indexOf(x) == -1);


  return { MEvent, MEventSource, order, hover, selection, clicked, dropIndices, nLimit, filterOrder, varCond, factorCond }
}