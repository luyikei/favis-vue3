
import * as d3 from "d3";

export class NetworkD3 {
  constructor(svg, $emit, ds, thres) {
    this.color = d3.scaleOrdinal([
      "#f28e2c",
      "#76b7b2",
      "#59a14f",
      "#edc949",
      "#af7aa1",
      "#ff9da7",
      "#9c755f",
      "#bab0ab"
    ]);
    
    this.links = this.svg.append("g").attr("class", "links");
    this.nodes = this.svg.append("g").attr("class", "nodes");
    this.hull = this.svg.append("g").attr("class", "hulls");
    this.$emit = $emit;
  }

  updateGraph() {
  }
}