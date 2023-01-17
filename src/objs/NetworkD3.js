
import * as d3 from "d3";

export class NetworkD3 {
  constructor(svg, $emit, ds, thres) {
    this.simulation = d3
      .forceSimulation()
      .force(
      "link",
      d3.forceLink().id(function (d) {
          return d.id;
      })
      )
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", () => this.simTick());
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
    this.simulation.stop();
    let graph = {};
    graph["nodes"] = [];
    graph["links"] = [];
    this.ds.names.forEach((element) => {
      graph["nodes"].push({
        id: element,
        groups: new Set(),
        group: 0,
      });
    });
    this.color.domain(d3.range(this.ds.matrix.length + 1));

    let lnks = Array(this.ds.names.length).fill(0).map(() => Array(this.ds.names.length).fill(0));
    for (let i = 0; i < this.ds.matrix.length; i++) {
      for (let j = 0; j < this.ds.matrix[i].length - 1; j++) {
        const element1 = this.ds.matrix[i][j].z;
        if (Math.abs(element1) <= this.thres) continue;
        for (let k = j + 1; k < this.ds.matrix[i].length; k++) {
          const element2 = this.ds.matrix[i][k].z;
          if (
            !lnks[j][k]  &&
            Math.abs(element2) > this.thres
            ) {
              lnks[j][k] = i + 1;
              graph["nodes"][j]["group"] = i + 1;
              graph["nodes"][k]["group"] = i + 1;
              graph["nodes"][j]["groups"].add(i + 1);
              graph["nodes"][k]["groups"].add(i + 1);
              graph["links"].push({
                source: this.ds.names[j],
                target: this.ds.names[k],
                value: 1,
                group: i + 1
              });
          }
        }
      }
    }

    let links = this.links;
    let nodes = this.nodes;
    let svg = this.svg;

    svg
        .attr("pointer-events", "all").call(d3
        .drag()
        .on("start", () => {
          svg.style("cursor", "grabbing");
        })
        .on("drag", (event) => {
          this.x -= event.dx/this.scale;
          this.y -= event.dy/this.scale;
        })
        .on("end", function() {
          svg.style("cursor", null);
        }));

    const old = new Map(
      nodes
        .selectAll("circle")
        .data()
        .map((d) => [d.id, d])
    );
    graph.nodes = graph.nodes.map((d) =>
      Object.assign(old.get(d.id) || {}, d)
    );
    graph.links = graph.links.map((d) => Object.assign({}, d));

    let node = nodes.selectAll("circle").data(graph.nodes, (d) => d.id);
    node
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill",  (d) => {
        return this.color(d.group);
      })
      .on("click", (e, d) => {
        let id = d.id;
        nodes.selectAll("circle").attr("stroke", "transparent");
        d3.select(e.target)
          .attr("stroke", "#000")
          .attr("stroke-opacity", this.link_opacity);
        links
          .selectAll("line")
          .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
          .each(function (d) {
            if (d.source.id === id || d.target.id === id) {
              d3.select(this)
                .attr("stroke", "#000")
                .attr("stroke-opacity", 1);
            }
          });
        this.$emit('clicked', {
          clickedVar: id,
          clickedPC: ""
        });
      })
      .on("mouseover", (_, d) => {
        this.selection.selected = d.id;
        this.$emit('selectionChanged', this.selection);
      })
      .call(drag(this.simulation))
      .append("title")
      .text(function (d) {
        return d.id;
      });
    node
      .attr("fill", (d) => {
        return this.color(d.group);
      })
      .call(drag(this.simulation));
    node.exit().remove();

    let link = links.selectAll("line").data(graph.links);
    link
      .enter()
      .append("line")
      .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
      .attr("stroke-opacity", this.link_opacity)
      .attr("stroke-width", function (d) {
        return Math.sqrt(d.value);
      })
      .on("mouseover", (_, d) => {
        this.selection.selectedPC = this.ds.row_names[d.group-1];
        this.$emit('selectionChanged', this.selection);
      });
    link
      .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
      .attr("stroke-opacity", this.link_opacity)
      .attr("stroke-width", function (d) {
        return Math.sqrt(d.value);
      });
    link.exit().remove();

    this.simulation.nodes(graph.nodes);

    this.simulation.force("link").links(graph.links);
    this.simulation.alpha(1).restart();

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }
  
  simTick() {
    this.links
      .selectAll("line")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
    this.nodes
      .selectAll("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
      if (this.displayHull) {
        let dat = this.nodes.selectAll("circle").data();
        let maxg = Math.max(...dat.map(v => v.group));
        let points =  Array.from({length: maxg + 1}, () => []);
        for (let i = 0; i < dat.length; i++) {
          const point = dat[i];
          point.groups.forEach(num => {
            points[num].push([point.x, point.y]);
          });
        }
        let pol = points.map(v => d3.polygonHull(v));
        pol = pol.map( v => v ? {data: v} : {data: []});
        for (let i = 0; i < pol.length; i++) {
          pol[i]["name"] = (i ? this.ds.row_names[i - 1] : "None");
        }
        let hulls = this.hull.selectAll("path").data(pol);
        hulls
          .enter()
          .append("path")
          .attr("d", function(d) {
            if (d.data.length) {
              return "M" + d.data.join("L") + "Z"; 
            } else {
              return null;
            }})
          .attr("fill", (d,i) => this.color(i))
          .attr("stroke", (d,i) => this.color(i))
          .attr("stroke-width", "2px")
          .attr("stroke-linejoin", "round")
          .attr("stroke-opacity", 0.3)
          .attr("opacity", 0.3)
          .on("mouseover", (_, d) => {
            this.selection.selectedPC = d["name"];
            this.$emit('selectionChanged', this.selection);
          });
        hulls
          .attr("d", function(d) {
            if (d.data.length) {
              return "M" + d.data.join("L") + "Z"; 
            } else {
              return null;
            }});
        hulls.exit().remove();
    } else {
        let hulls = this.hull.selectAll("path").data([]);
        hulls.exit().remove();
    }
  }
}