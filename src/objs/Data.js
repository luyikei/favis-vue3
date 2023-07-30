'use strict';

import { create, all } from 'mathjs'

const config = { }
const math = create(all, config)

let range = function(n) {
  return Array.from(new Array(n), (x, i) => i);
}

export class Data {
  matrix;
  names;
  row_names;
  rawmat;
  orders;
  rorders;
  simorders;
  rsimorders;
  table;
  tablet;
  constructor(rawmat, names, row_names, {phi, codebook} = {}) {
    let matrix = [];
    let n = rawmat.length;
    let m = names.length;

    if (row_names.length > 0)
      this.row_names = row_names;
    else {
      this.row_names = range(n).map(x => `F${x+1}`)
    }

    let rorders = [];
    let rsimorders = [];
    let orders = [];
    let simorders = [];
    this.max = -Infinity
    this.min = Infinity;
    rorders.push(range(n));
    rsimorders.push(range(n));
    orders.push(range(m));
    simorders.push(range(m));
    // Compute index per node.
    rawmat.forEach((row, i) => {
      matrix[i] = range(m).map((j) => {
        const z = parseFloat(row[j]);
        this.max = Math.max(this.max, z);
        this.min = Math.min(this.min, z);
        return {x: j, y: i, z}; 
      });
      orders.push(range(m).sort((a, b) => matrix[i][b].z - matrix[i][a].z));
      const svalues = range(n).map(x => math.norm(math.subtract(math.abs(rawmat[x]), math.abs(rawmat[i]))));
      rsimorders.push(range(n).sort((a, b) => svalues[a] - svalues[b] ));
    });
    
    let rawmatt = math.transpose(rawmat);
    names.forEach((d, i) => {
      rorders.push(range(rawmat.length).sort((a, b) => matrix[b][i].z - matrix[a][i].z));
      const svalues = range(m).map(x => math.norm(math.subtract(math.abs(rawmatt[x]), math.abs(rawmatt[i]))));
      simorders.push(range(m).sort((a, b) => svalues[a] - svalues[b] ));
    } );

    this.table = [];
    for (let i = 0; i < rawmat.length; ++i) {
      let val = {};
      val["Factor"] = this.row_names[i]; 
      for (let j = 0; j < rawmat[i].length; ++j) {
        val[names[j]] = Math.round(rawmat[i][j] * 100) / 100; 
      }
      this.table.push(val);
    }

    this.tablet = [];
    for (let j = 0; j < rawmat[0].length; ++j) {
      let val = {};
      val["Variable"] = names[j]; 
      for (let i = 0; i < rawmat.length; ++i) {
        val[this.row_names[i]] = Math.round(rawmat[i][j] * 100) / 100; 
      }
      this.tablet.push(val);
    }
    
    this.orders = orders;
    this.rorders = rorders;
    this.simorders = simorders;
    this.rsimorders = rsimorders;
    this.rawmat = rawmat;
    this.matrix = matrix;
    this.names = names;
    this.phi = phi;
    this.codebook = codebook;
  }

  static abs(data) {
    return new Data(math.abs(data.rawmat), data.names, data.row_names, {phi:data.phi, codebook:data.codebook});
  }

  static transpose(data) {
    return new Data(math.transpose(data.rawmat), data.row_names, data.names, {phi:data.phi, codebook:data.codebook});
  }
}

