<template>
<div ref="table"></div>
</template>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>

<script>
import * as d3 from "d3";
import {TabulatorFull as Tabulator} from 'tabulator-tables'; //import Tabulator library

import { useCommonProps } from '@/objs/commonProps.js'

export default {
  props: ["ds", "commonProps"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    const {selection, clicked} = useCommonProps();
    return {
      tabulator: null, //variable to hold your table
      selection: selection,
      clicked: clicked,
      tableBuilt: false
    };
  },
  watch: {
    commonProps: {
      handler(commonProps) {
        if (!this.tableBuilt) return;
        this.ds.names.forEach((name) => {
          if (name.startsWith(commonProps.searchText)) this.tabulator.showColumn(name);
          else this.tabulator.hideColumn(name);
        });
      },
      deep: true
    },
    selection: {
      handler(selection) {
        this.highlight();
      },
      deep: true
    },
    clicked: {
      handler(clicked) {
        this.highlight();
      },
      deep: true
    }
  },
  methods: {
    highlight() {
      if (!this.tableBuilt) return;
      if (this.prevClicked) {
        this.prevClicked.style("background-color", null);
        this.prevClicked = null;
      } 
      d3.selectAll(".tabulator-col-title").nodes().forEach((e) => {
        if (this.selection.var.has(this.ds.names.indexOf(e.textContent))) {
          d3.select(e.parentNode.parentNode).style("background-color", "#EEEEEE");
        } else {
          d3.select(e.parentNode.parentNode).style("background-color", "#FFFFFF");
        }
      });

      d3.selectAll(".tabulator-frozen-left").nodes().forEach((e) => {
        if (this.selection.factor.has(this.ds.row_names.indexOf(e.textContent))) {
          d3.select(e).style("background-color", "#EEEEEE");
        } else {
          d3.select(e).style("background-color", "#FFFFFF");
        }
      });

      if (typeof this.clicked.var == "number") {
        d3.selectAll(".tabulator-col-title").nodes().forEach((e) => {
          if (e.textContent == this.ds.names[this.clicked.var]) {
            this.prevClicked = d3.select(e.parentNode.parentNode).style("background-color", "#DDDDDD");
          }
        });
        d3.selectAll(".tabulator-frozen-left").nodes().forEach((e) => {
          if (e.textContent == this.ds.row_names[this.clicked.factor]) {
            d3.select(e).style("background-color", "#EEEEEE");
          } else {
            d3.select(e).style("background-color", "#FFFFFF");
          }
        });
        this.tabulator.scrollToColumn(this.ds.names[this.clicked.var], "middle");
        if (this.clicked.sort) {
          this.tabulator.setSort([
            {column: this.ds.names[this.clicked.var], dir:"desc"}, //then sort by this second
          ]);
        }
      }
    },
  },
  mounted() {
    //instantiate Tabulator when element is mounted
    this.tabulator = new Tabulator(this.$refs.table, {// set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
      data: this.ds.table, //assign data to table
      columns: ([{title:"Factor", field:"Factor", frozen:true}]).concat(this.ds.names.map((x, i) => {
        const ret = {
            title:x,
            field:x,
            headerSortStartingDir:"desc",
            headerClick(e, column) {
              this.$store.commit("updateClicked", {
                var: i,
                factor: null,
                sort: true
              });
            },
            cellClick(e, cell) {
              console.log(cell);
              this.$store.commit("updateClicked", {
                var: i,
                factor: this.ds.row_names.indexOf(cell._cell.row.data.Factor),
                sort: false
              });
            },
        };
        ret.headerClick = ret.headerClick.bind(this);
        ret.cellClick = ret.cellClick.bind(this);
        return ret;
      })),
      pagination:"local",       //paginate the data
      paginationSize:7,         //allow 7 rows per page of data
      paginationCounter:"rows", //display count of paginated rows in footer
    });
    this.tabulator.on("tableBuilt", () => this.tableBuilt = true);
  }
};
  </script>
  