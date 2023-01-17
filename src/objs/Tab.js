'use strict';

export class Tab {
    constructor(title, data, type) {
        this.title = title;
        this.data = data

        switch(type) {
            case(Tab.Types.SCATTER):
                this.type = type;
                break;
            case(Tab.Types.PARA):
                this.type = type;
                break;
            case(Tab.Types.NETWORK):
                this.type = type;
                break;
            case(Tab.Types.DATA):
                this.type = type;
                break;
            case(Tab.Types.HEATMAP):
                this.type = type;
                break;
            case(Tab.Types.HOME):
                this.type = type;
                break;
            case(Tab.Types.MULTIPLE):
                this.type = type;
                break;
            default:
                throw "Invalid Tab Type: " + type;
        }
    }
    
    static Types = {
        DATA:"data",
        HEATMAP:"heatmap",
        SCATTER:"scatter",
        PARA:"para",
        NETWORK:"network",
        HOME:"home",
        MULTIPLE:"multiple",
    };
}

