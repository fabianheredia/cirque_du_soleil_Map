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

        //--------------------------------------------------------------------------
        //
        //  Setup Map and View
        //
        //--------------------------------------------------------------------------

        var layer = new FeatureLayer({
          url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_Voting_Precincts_2008_Election/FeatureServer/0",
          // don't show precincts that didn't record any votes
          definitionExpression: "(P2008_D > 0) AND (P2008_R > 0)",
          title: "Voting precincts"
        });

        var view = new MapView({
          map: new Map({
            basemap: {
              portalItem: {
                id: "3582b744bba84668b52a16b0b6942544"
              }
            },
            layers: [layer]
          }),
          container: "viewDiv",
          constraints: {
            snapToZoom: false
          },
          extent: {
            xmin: -126.902,
            ymin: 23.848,
            xmax: -65.73,
            ymax: 50.15
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

        // When the layerview is available, setup hovering interactivity
        view.whenLayerView(layer).then(setupHoverTooltip);

        // Starts the application by visualizing a gap of 50% between the two candidates
        setGapValue(50);

        //--------------------------------------------------------------------------
        //
        //  Methods
        //
        //--------------------------------------------------------------------------

        /**
         * Sets the current visualized gap.
         */
        function setGapValue(value) {
          sliderValue.innerHTML = "<span style='font-weight:bold; font-size:150%'>" + (Math.round(value * 100) / 100)
            .toFixed(2) + " %</span> of the votes separate the two candidates";
          slider.value = value;
          layer.renderer = createRenderer(value);
        }

        /**
         * Creates a unique value renderer with opacity visual variable centered around a gap between the 2 candidates.
         */
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
            field: "Majority",
            uniqueValueInfos: [{
              value: "Obama",
              symbol: {
                type: "simple-marker",
                size: 9,
                color: "rgb(0, 92, 230)",
                outline: {
                  color: "rgba(255, 255, 255, 0.5)",
                  width: 0.75
                }
              }
            }, {
              value: "McCain",
              symbol: {
                type: "simple-marker",
                size: 9,
                color: "rgb(255, 20, 20)",
                outline: {
                  color: "rgba(255, 255, 255, 0.5)",
                  width: 0.75
                }
              }
            }, {
              value: "Tied",
              symbol: {
                type: "simple-marker",
                size: 9,
                color: "rgb(158, 85, 156)",
                outline: {
                  color: "rgba(255, 255, 255, 0.5)",
                  width: 0.75
                }
              }
            }],
            visualVariables: [{
              type: "opacity",
              // Arcade expression that calculates the gap between
              valueExpression: "var fields = [$feature.P2008_D,$feature.P2008_R];" +
                "var sorted = Reverse(Sort(fields));" +
                "Round(((sorted[0] - sorted[1])/Sum(fields)*100), 2);",
              valueExpressionTitle: "% gap",
              stops: opacityStops
            }, {
              type: "size",
              minDataValue: 600,
              maxDataValue: 4562,
              minSize: 3,
              maxSize: 20,
              valueExpression: "$feature.P2008_D + $feature.P2008_R",
              valueExpressionTitle: "Turnout",
              valueUnit: "unknown"
            }]
          };
        }

        /**
         * Sets up a moving tooltip that displays
         * a chart with the voter count for each candidate,
         * and the gap between the two.
         */
        function setupHoverTooltip(layerview) {
          var hitTestPromise;
          var highlight;

          var tooltip = createTooltip();

          function hitTest(point) {
            if (hitTestPromise) {
              hitTestPromise.cancel();
            }

            hitTestPromise = view.hitTest(point.x, point.y)
              .then(function (hit) {
                hitTestPromise = null;

                var results = hit.results.filter(function (result) {
                  return result.graphic.layer === layer;
                });

                if (results.length) {
                  var graphic = results[0].graphic;
                  var screenPoint = hit.screenPoint;

                  return {
                    graphic: graphic,
                    screenPoint: screenPoint,
                    values: {
                      democrat: Math.round(graphic.getAttribute("P2008_D")),
                      republican: Math.round(graphic.getAttribute("P2008_R"))
                    }
                  };
                } else {
                  return null;
                }
              });

            return hitTestPromise;
          }

          view.on("pointer-move", function (event) {
            hitTest(event).then(function (result) {
              if (highlight) {
                highlight.remove();
                highlight = null;
              }

              if (!result) {
                tooltip.hide();
                view.surface.style.cursor = "auto";
              } else {
                highlight = layerview.highlight(result.graphic);
                tooltip.show(result.screenPoint, result.values);
                view.surface.style.cursor = "pointer";
              }
            });
          });

          view.on("click", function (event) {
            hitTest(event).then(function (result) {
              if (!result) {
                return;
              }

              stopAnimation();

              var dem = result.values.democrat;
              var rep = result.values.republican;
              var p_gap = (Math.max(dem, rep) - Math.min(dem, rep)) / (dem + rep) * 100;
              animation = animateTo(p_gap);
            });
          });
        }

        /**
         * Starts the animation that cycle
         * through the gap between the two candidates.
         */
        function startAnimation() {
          stopAnimation();
          animation = animate(parseFloat(slider.value));
          playButton.classList.add("toggled");
        }

        /**
         * Stops the animations
         */
        function stopAnimation() {
          if (!animation) {
            return;
          }

          animation.remove();
          animation = null;
          playButton.classList.remove("toggled");
        }

        /**
         * Animates the visualized gap continously.
         */
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

        /**
         * Animates to a gap value.
         */
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
              setGapValue(value + (targetValue - value) * 0.25);
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

        /**
         * Creates a tooltip to display a chart showing the raw voters count
         * and the gap between the two candidates.
         */
        function createTooltip() {
          var tooltip = document.createElement("div");
          var style = tooltip.style;

          style.opacity = 0;
          tooltip.setAttribute("role", "tooltip");
          tooltip.classList.add("tooltip");

          var content = document.getElementById("tooltipContent");
          content.style.visibility = "visible";
          content.classList.add("esri-widget");
          tooltip.appendChild(content);

          view.container.appendChild(tooltip);

          var x = 0;
          var y = 0;
          var targetX = 0;
          var targetY = 0;
          var visible = false;
          var moveRaFTimer;

          function move() {
            function moveStep() {
              moveRaFTimer = null;
              x += (targetX - x) * 0.5;
              y += (targetY - y) * 0.5;

              if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
                x = targetX;
                y = targetY;
              } else {
                moveRaFTimer = requestAnimationFrame(moveStep);
              }

              style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
            }

            if (!moveRaFTimer) {
              moveRaFTimer = requestAnimationFrame(moveStep);
            }
          }

          var dem;
          var rep;
          var updateRaFTimer;

          function updateContent(values) {
            if (dem === values.democrat && rep === values.republican) {
              return;
            }

            dem = values.democrat;
            rep = values.republican;
            cancelAnimationFrame(updateRaFTimer);

            updateRaFTimer = requestAnimationFrame(function () {
              var p_gap = (Math.max(dem, rep) - Math.min(dem, rep)) / (dem + rep);
              p_gap = Math.round(p_gap * 10000) / 100;
              var p_dem = (dem / (dem + rep)) * 100;
              var p_rep = (rep / (dem + rep)) * 100;

              document.querySelector("#chart .row.democrat .bar").style.width = p_dem + "%";
              document.querySelector("#chart .row.democrat .value > span").innerHTML = dem;

              document.querySelector("#chart .row.republican .bar").style.width = p_rep + "%";
              document.querySelector("#chart .row.republican .value > span").innerHTML = rep;

              document.querySelector("#chart .row.gap .bar").style.width = p_gap + "%";
              document.querySelector("#chart .row.gap .bar").style.marginLeft = Math.min(p_dem, p_rep) + "%";
              document.querySelector("#chart .row.gap .value > span").innerHTML = p_gap + "%";
            });
          }

          return {
            show: function (point, values) {
              if (!visible) {
                x = point.x;
                y = point.y;
              }

              targetX = point.x;
              targetY = point.y;
              style.opacity = 1;
              visible = true;

              move();
              updateContent(values);
            },

            hide: function () {
              style.opacity = 0;
              visible = false;
            }
          };
        }
      });