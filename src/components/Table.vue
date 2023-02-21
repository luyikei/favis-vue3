<template>
<div ref="table"></div>
</template>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>

<script>
import * as d3 from "d3";
import {TabulatorFull as Tabulator} from 'tabulator-tables'; //import Tabulator library

export default {
  props: ["ds", "commonProps"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    return {
      tabulator: null, //variable to hold your table
      clicked: {
        var: null,
        factor: null,
        sort: null
      },
      tableBuilt: false
    };
  },
  watch: {
    commonProps: {
      handler(commonProps){
        this.clicked.var = commonProps.clickedVar;
        this.clicked.factor = commonProps.clickedFactor;
        this.clicked.sort = commonProps.clickedSort;
        if (!this.tableBuilt) return;
        this.ds.names.forEach((name) => {
          if (name.startsWith(commonProps.searchText)) this.tabulator.showColumn(name);
          else this.tabulator.hideColumn(name);
        });
        if (this.prevClicked) {
          this.prevClicked.style("background-color", null);
          this.prevClicked = null;
        } 
        if (this.clicked.var) {
          d3.selectAll(".tabulator-col-title").nodes().forEach((e) => {
            if (e.textContent == this.ds.names[this.clicked.var]) {
              this.prevClicked = d3.select(e.parentNode.parentNode).style("background-color", "#EEEEEE");
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
      deep: true
    }
  },
  mounted() {
    //instantiate Tabulator when element is mounted
    this.tabulator = new Tabulator(this.$refs.table, {// set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
      data:this.ds.table, //assign data to table
      columns: ([{title:"Factor", field:"Factor", frozen:true}]).concat(this.ds.names.map((x, i) => {
        const ret = {
            title:x,
            field:x,
            headerSortStartingDir:"desc",
            headerClick(e, column) {
              this.clicked = {
                var: i,
                factor: null,
                sort: true
              };
              this.$emit('clicked', this.clicked);
            },
            cellClick(e, cell) {
              this.clicked = {
                var: i,
                factor: null,
                sort: false
              };
              this.$emit('clicked', this.clicked);
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
  