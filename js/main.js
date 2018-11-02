require([
        "require",
        "esri/Map",
        "esri/layers/FeatureLayer",
        "esri/views/MapView",
        "esri/widgets/Legend",
        "esri/widgets/Home",
        "esri/widgets/Fullscreen",
        "esri/widgets/Expand"
    ],
    function (
        require,
        Map,
        FeatureLayer,
        MapView,
        Legend, Home, Fullscreen, Expand
    ) {
//https://services.arcgis.com/8DAUcrpQcpyLMznu/arcgis/rest/services/cirquedusoleil_2018/FeatureServer/0
//https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_Voting_Precincts_2008_Election/FeatureServer/0
        var layer = new FeatureLayer({
            url: "https://services.arcgis.com/8DAUcrpQcpyLMznu/arcgis/rest/services/cirquedusoleil2018_2/FeatureServer/0",
            // don't show precincts that didn't record any votes
            definitionExpression: "1=1",
            title: "Tour Cirque du Soleil"
        });

        var view = new MapView({
            map: new Map({
                basemap: {
                    portalItem: {
                        id: "ef96f66edb564033827feaec7818ae75"
                        //ef96f66edb564033827feaec7818ae75
                        //3582b744bba84668b52a16b0b6942544
                    }
                },
                layers: [layer]
            }),
            container: "viewDiv",
            constraints: {
                snapToZoom: true
            },
            extent: {
              xmin: -130,
              ymin: -19,
              xmax: 120,
              ymax: 75
            }
        });

        //--------------------------------------------------------------------------
        //
        //  Setup UI
        //
        //--------------------------------------------------------------------------

        view.ui.empty("top-left");

        var applicationDiv = document.getElementById("applicationDiv");
        var slider = document.getElementById("slider");
        var sliderValue = document.getElementById("sliderValue");
        var playButton = document.getElementById("playButton");
        var titleDiv = document.getElementById("titleDiv");
        var animation = null;

        function inputHandler() {
            stopAnimation();
            setGapValue(parseInt(slider.value));
        }
        slider.addEventListener("input", inputHandler);
        slider.addEventListener("change", inputHandler);

        playButton.addEventListener("click", function () {
            if (playButton.classList.contains("toggled")) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        view.ui.add(titleDiv, "top-left");
        view.ui.add(new Expand({
            view: view,
            content: new Legend({
                view: view
            })
        }), "top-left");
        view.ui.add(new Home({
            view: view
        }), "top-left");
        view.ui.add(new Fullscreen({
            view: view,
            element: applicationDiv
        }), "top-right");

        // // When the layerview is available, setup hovering interactivity
         //view.whenLayerView(layer).then(setupHoverTooltip);

        // // Starts the application by visualizing a gap of 50% between the two candidates
         setGapValue(1);
         startAnimation();
        // //--------------------------------------------------------------------------
        // //
        // //  Methods
        // //
        // //--------------------------------------------------------------------------

        // /**
        //  * Sets the current visualized gap.
        //  */
        function setGapValue(value) {
            sliderValue.innerHTML = "<span style='font-weight:bold; font-size:150%'> Animación </span>";
            slider.value = value;
            layer.renderer = createRenderer(value);
        }

        // /**
        //  * Creates a unique value renderer with opacity visual variable centered around a gap between the 2 candidates.
        //  */
        function createRenderer(gapValue) {
            gapValue = Math.min(100, Math.max(0, gapValue));

            function roundToTheTenth(value) {
                return Math.round(value * 10) / 10;
            }

            // Create stops for an opacity visual variable where the gap value has an opacity
            // of one, and values greater or lesser than +/- 2.5% points from the gap value are
            // nearly completely transparent
            var opacityStops = [{
                opacity: 0.02,
                value: roundToTheTenth(gapValue - 2.5)
            }, {
                opacity: 1,
                value: roundToTheTenth(gapValue)
            }, {
                opacity: 0.02,
                value: roundToTheTenth(gapValue + 2.5)
            }];

            // If the gap is < 0, then adjust the first stop so the value is 0
            if (gapValue - 2.5 < 0) {
                opacityStops[0].opacity = 0.1 + -opacityStops[0].value / 2.5;
                opacityStops[0].value = 0;
            }

            // If the gap is > 100, then adjust the last stop so the value is 100
            if (gapValue + 2.5 > 100) {
                opacityStops[2].opacity = (opacityStops[2].value - 100) / 2.5 + 0.1;
                opacityStops[2].value = 100;
            }

            // return a new renderer with the calculated opacity visual variable
            return {
                type: "unique-value",
                field: "montaje",
                uniqueValueInfos: [{
                        value: "ALEGRIA",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(253, 179, 57)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    }, {
                        value: "AMALUNA",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(251, 254, 254)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    }, {
                        value: "BAZZAR",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(121, 103, 169)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "CORTEO",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(209, 75, 26)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "CRYSTAL",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(255, 94, 165)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "KOOZA",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(247, 180, 41)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "KURIOS",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(0, 92, 230)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "LUZIA",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(193, 81, 152)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "OVO",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(7, 7, 156)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "PARAMOUR",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(172, 20, 92)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "THE LAND OF FANTASY",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(74, 179, 156)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "TORUK",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(2, 123, 189)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "TOTEM",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(19, 155, 175)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    },
                    {
                        value: "VOLTA",
                        symbol: {
                            type: "simple-marker",
                            size: 9,
                            color: "rgb(81, 148, 0)",
                            outline: {
                                color: "rgba(255, 255, 255, 0.5)",
                                width: 0.75
                            }
                        }
                    }
                ],
                visualVariables: [{
                    type: "opacity",
                    // Arcade expression that calculates the gap between
                    valueExpression: "var fields = [$feature.valor1,$feature.valor2];" +
                        "var sorted = Reverse(Sort(fields));" +
                        "Round(((sorted[0] - sorted[1])/Sum(fields)*100), 2);",
                    valueExpressionTitle: "% gap",
                    stops: opacityStops
                },{
                    type: "size",
                    minDataValue: 0,
                    maxDataValue: 90,
                    minSize: 3,
                    maxSize: 20,
                    valueExpression: "$feature.valor1 + $feature.valor2",
                    valueExpressionTitle: "montaje",
                    valueUnit: "unknown"
                  }]
            };
        }

      
        function startAnimation() {
            stopAnimation();
            animation = animate(parseFloat(slider.value));
            playButton.classList.add("toggled");
        }

        // /**
        //  * Stops the animations
        //  */
        function stopAnimation() {
            if (!animation) {
                return;
            }

            animation.remove();
            animation = null;
            playButton.classList.remove("toggled");
        }

        // /**
        //  * Animates the visualized gap continously.
        //  */
        function animate(startValue) {
            var animating = true;
            var value = startValue;
            var direction = 0.1;

            var frame = function () {
                if (!animating) {
                    return;
                }

                value += direction;
                if (value > 100) {
                    value = 100;
                    direction = -direction;
                } else if (value < 0) {
                    value = 0;
                    direction = -direction;
                }

                setGapValue(value);
                requestAnimationFrame(frame);
            };

            requestAnimationFrame(frame);

            return {
                remove: function () {
                    animating = false;
                }
            };
        }

        // /**
        //  * Animates to a gap value.
        //  */
        function animateTo(targetValue) {
            var animating = true;

            var frame = function () {
                if (!animating) {
                    return;
                }

                var value = parseFloat(slider.value);

                if (Math.abs(targetValue - value) < 1) {
                    animating = false;
                    setGapValue(targetValue);
                } else {
                    setGapValue(value + (targetValue - value) * 1);
                    requestAnimationFrame(frame);
                }
            };

            requestAnimationFrame(frame);

            return {
                remove: function () {
                    animating = false;
                }
            };
        }

        
    });