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
  constructor(rawmat, names, row_names, codebook) {
    let matrix = [];
    let n = rawmat.length;
    let m = names.length;

    let rorders = [];
    let orders = [];
    rorders.push(range(n));
    orders.push(range(m));
    // Compute index per node.
    rawmat.forEach((row, i) => {
        const row_array = Object.values(row);
        matrix[i] = range(m).map((j) => {
          return {x: j, y: i, z:  parseFloat(row_array[j])}; 
        });
        orders.push(range(m).sort((a, b) => matrix[i][b].z - matrix[i][a].z));
    });

    names.forEach(
        (d, i) => rorders.push(
          range(rawmat.length).sort((a, b) => matrix[b][i].z - matrix[a][i].z)
        )
    );
    
    this.orders = orders;
    this.rorders = rorders;
    this.rawmat = rawmat;
    this.matrix = matrix;
    this.names = names;
    if (row_names.length > 0)
      this.row_names = row_names;
    else {
      this.row_names = range(n).map(x => `F${x+1}`)
    }
    this.codebook = codebook;
  }

  static abs(data) {
    return new Data(math.abs(data.rawmat), data.names, data.row_names, data.codebook);
  }
}

