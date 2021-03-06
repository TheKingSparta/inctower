define(['incTower/core', 'lib/knockout', 'lib/bignumber', 'incTower/cursor', 'incTower/path', 'incTower/util'], function (incTower, ko, BigNumber, Cursor, pathModule) {
    'use strict';
    var tileSquare = 32;
    incTower.deadBullets = {};
    var incrementObservable = incTower.incrementObservable;
    incTower.gold = ko.observable(new BigNumber(150));
    incTower.gainGold = function (amount, floatAround) {
        //amount = amount.times(1 + 0.1 * incTower.prestigePoints());
        incrementObservable(incTower.gold, amount);
        if (floatAround !== undefined) {
            incTower.createFloatingText({
                'color': '#C9960C',
                'duration': 3000,
                'around': floatAround,
                'text': '+' + incTower.humanizeNumber(amount) + 'g',
                'scatter': 16,
                'type': 'gold'
            });
        }
    };
    
    incTower.wave = ko.observable(0);
    incTower.buyBlock = function () {
         var curCursor = incTower.cursor();
        //If our cursor already holds this spell then cancel it.
        if (curCursor !== false && curCursor.type === 'buy' && curCursor.param === 'block') {
            incTower.clearCursor();
            return;
        }
        var cost = incTower.blockCost();
        if (incTower.gold().gt(cost)) {
            incTower.cursor(new Cursor('buy', 'block', function (pointer) {
                var tileX = Math.floor(pointer.worldX / tileSquare);
                var tileY = Math.floor(pointer.worldY / tileSquare);
                if (tileX > 24 || tileY > 18) {
                    return;
                }
                if (tileX === 0 && tileY === 0) {
                    return;
                }
                var cost = incTower.blockCost();
                if (incTower.gold().gte(cost) && incTower.core.map.layers[0].data[tileY][tileX].index > 8) {
                    incrementObservable(incTower.gold, -cost);
                    incTower.core.map.putTile(incTower.game.rnd.integerInRange(5, 8), tileX, tileY, "Ground");
                    incTower.blocks.push({x: tileX, y: tileY});
                    _.forEach(pathModule.path, function (pathUnit) {
                        if (pathUnit.x === tileX && pathUnit.y === tileY) {
                            pathModule.recalcPath();
                            return false;
                        }
                    });
                }
            }, function (x, y) {
                var tileX = Math.floor(x / tileSquare);
                var tileY = Math.floor(y / tileSquare);
                //console.log([x,y]);
                var valid = true;
                if (valid && (tileX > 24 || tileY > 18)) {
                    valid = false;
                }
                if (tileX === 0 && tileY === 0) {
                    valid = false;
                }
                if (valid) {
                    var tileIndex = incTower.core.map.layers[0].data[tileY][tileX].index;
                    if (tileIndex > 4 && tileIndex < 9) {
                        valid = false;
                    }
                }
                if (valid !== this.currentIndicatorStatus || tileX !== this.lastTileX || tileY !== this.lastTileY) {
                    this.indicator.clear();

                    if (valid) {
                        //this.indicator.beginFill(0x33FF33, 0.5);
                        this.indicator.beginFill(0x3333FF, 0.5);
                        if (!this.textIndicator) {
                            this.textIndicator = incTower.game.add.text(0, 0, "", {
                                font: "14px Arial",
                                stroke: 'white',
                                strokeThickness: 1,
                                fontWeight: "bold",
                                fill: '#C9960C',
                                align: "center"
                            });
                        }
                        this.textIndicator.alpha = 1;
                        var cost = incTower.blockCost();
                        this.textIndicator.text = '-' + incTower.humanizeNumber(cost) + 'g';
                    } else {
                        if (this.textIndicator !== undefined) {
                            this.textIndicator.alpha = 0;
                        }
                        this.indicator.beginFill(0x760076, 0.5);
                    }
                    this.indicator.drawRect(0, 0, 32, 32);
                    this.currentIndicatorStatus = valid;
                    this.lastTileX = tileX;
                    this.lastTileY = tileY;
                }


            }));

        }
    };
    incTower.sellTool = function () {
        var curCursor = incTower.cursor();
        //If our cursor already holds this spell then cancel it.
        if (curCursor !== false && curCursor.type === 'sell' && curCursor.param === '') {
            incTower.clearCursor();
            return;
        }
        incTower.cursor(new Cursor('sell', '', function (pointer) {
            var tileX = Math.floor(pointer.worldX / tileSquare);
            var tileY = Math.floor(pointer.worldY / tileSquare);
            if (tileX > 24 || tileY > 18) {
                return;
            }
            if (tileX === 0 && tileY === 0) {
                return;
            }
            var tileIndex = incTower.core.map.layers[0].data[tileY][tileX].index;
            if (tileIndex > 4 && tileIndex < 9 && pathModule.tileForbidden[tileX][tileY]) {
                //Don't allow selling at one tower
                if (incTower.numTowers() === 1) {
                    return false;
                }
                _.forEach(incTower.towers_group.children, function (tower) {
                    if (tower.tileX === tileX && tower.tileY === tileY) {
                        tower.sell();
                        return false;
                    }
                });
                return;
            }
            if (tileIndex > 4 && tileIndex < 9 && !pathModule.tileForbidden[tileX][tileY]) {
                incTower.core.map.putTile(30, tileX, tileY, "Ground");
                incrementObservable(incTower.gold, incTower.prevBlockCost());
                for (var i = 0; i < incTower.blocks().length; i++) {
                    var curBlock = incTower.blocks()[i];
                    if (curBlock.x === tileX && curBlock.y === tileY) {
                        incTower.blocks.splice(i, 1);
                        break;
                    }
                }
                pathModule.recalcPath();
            }
        }, function (x, y) {
            var tileX = Math.floor(x / tileSquare);
            var tileY = Math.floor(y / tileSquare);
            //console.log([x,y]);
            var valid = true;
            if (valid && (tileX > 24 || tileY > 18)) {
                valid = false;
            }
            if (tileX === 0 && tileY === 0) {
                valid = false;
            }
            if (valid) {
                var tileIndex = incTower.core.map.layers[0].data[tileY][tileX].index;
                if (!(tileIndex > 4 && tileIndex < 9)) {
                    valid = false;
                }
            }
            if (valid !== this.currentIndicatorStatus || tileX !== this.lastTileX || tileY !== this.lastTileY) {
                this.indicator.clear();

                if (valid) {
                    //this.indicator.beginFill(0x33FF33, 0.5);
                    this.indicator.beginFill(0x3333FF, 0.5);
                    if (!this.textIndicator) {
                        this.textIndicator = incTower.game.add.text(0, 0, "", {
                            font: "14px Arial",
                            stroke: 'white',
                            strokeThickness: 1,
                            fontWeight: "bold",
                            fill: '#C9960C',
                            align: "center"
                        });
                    }
                    this.textIndicator.alpha = 1;
                    var cost;
                    if (pathModule.tileForbidden[tileX][tileY]) {
                        _.forEach(incTower.towers.children, function (tower) {
                            if (tower.tileX === tileX && tower.tileY === tileY) {
                                cost = tower.sellValue();
                                return false;
                            }
                        });
                    }
                    if (cost === undefined) {
                        cost = incTower.prevBlockCost();
                    }
                    this.textIndicator.text = '+' + incTower.humanizeNumber(cost) + 'g';

                } else {
                    if (this.textIndicator !== undefined) {
                        this.textIndicator.alpha = 0;
                    }
                    this.indicator.beginFill(0x760076, 0.5);
                }
                this.indicator.drawRect(0, 0, 32, 32);
                this.currentIndicatorStatus = valid;
                this.lastTileX = tileX;
                this.lastTileY = tileY;
            }


        }));
    };
    incTower.cheapestUpgrade = function () {
        var tower = incTower.cheapestUpgradeCostTower();
        tower.payToUpgrade();
    };

    return incTower;
});

