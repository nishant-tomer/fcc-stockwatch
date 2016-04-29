$(function () {

    var seriesOptions = [],
        seriesCounter = 0;

    var socket = io.connect();
    socket.on('connect', function() {
    });

    socket.on("add",function(data){
         addSeries(data.name)
    })
    socket.on("remove",function(data){
        removeSeries(data.id)
    })

    if (symbols !== "[]" && symbols !== null ) {
        symbols = JSON.parse(symbols)
        $.each(symbols, function (i, symbol) {
          $.getJSON('/stock/'+symbol.name)
            .done( function (seriesData) {
              var timeSeries = seriesData.data;
  				    var data = highStock(timeSeries);
                  seriesOptions[i] = {
                    name: seriesData.name,
                    id:seriesData._id,
                    data: data
                }
                seriesCounter += 1;
                if (seriesCounter === symbols.length) {
                    createChart();
                }
            })
            .fail( function( jqxhr, textStatus, error ) {
              error(textStatus + error)
            })
      })
    }


    $('#add').click(function () {
        $("#msg").html("Real time syncing with everyone else")
        var name = $("#input").val().trim().toUpperCase()
        if( validate(name) ){
          $("#input").val("")
          socket.emit("add",{"name":name})
        } else {
          error("Invalid Code")
        }
    })

    $(document).on('click',".remove",function(event){
      var id = $(this).attr("id")
      socket.emit("remove", {"id":id})
    })

    function createChart() {

        $('#containerChart').highcharts('StockChart', {

          credits:{
            enabled:false
          },
          navigator:{
            enabled:false
          },
            rangeSelector: {
               selected: 1
           },

           title: {
               text: 'Synced Stock Charts'
           },
            yAxis: {
                labels: {
                    formatter: function () {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },

            plotOptions: {
                series: {
                    compare: 'percent'
                }
            },

            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                valueDecimals: 2
            },

            series: seriesOptions
        });
    }

    function addSeries(name){
      var chart = $('#containerChart').highcharts();
      $.getJSON('/stock/'+ name)
            .done(function (seriesData) {
              var timeSeries = seriesData.data;
              var data = highStock(timeSeries);
              chart.addSeries({
                  name: seriesData.name,
                  id: seriesData._id,
                  data:data
              });
              addPanel(seriesData)
            })
            .fail(function( jqxhr, textStatus, error ) {
              error(textStatus + error)
          });
    }

    function addPanel(stock){
      var el = ''+
      '<div style="padding: 1%;" class="col-md-4 symbol">'+
      '<div style="padding: 2% 5%; color:white; border-left:solid 5px #cc00ff;background:#cc6600;'+
      'min-height: 125px;">' +
      '<h3>' + stock.name +
      '<button style="font-size:0.9rem;" class="remove btn btn-xs btn-danger glyphicon ' + 'glyphicon-remove pull-right" id="'+ stock._id +
      '"></button></h3>' +
      '<p>' + stock.desc +
      '</p></div></div>'

      $(el).insertBefore("#inputPanel")

    }

    function removeSeries(id){
      var chart = $('#containerChart').highcharts()
      $("#"+id).closest(".symbol").remove()
      chart.get(id).remove()
    }

    function highStock(data){
    		var timeSeries = [];
    		for (var i = 0 ; i < data.length ; i++){
    			var yr = data[i][0].split('-')[0];
    			var mo = data[i][0].split('-')[1];
    			var dy = data[i][0].split('-')[2];
    			var date = Date.UTC(yr,mo - 1,dy);
    			var price = data[i][4];
    			timeSeries.push([date,price]);
    		}
    		return timeSeries;
    	}


    function validate(string){
          var pattern = /^[a-zA-Z]+$/
          if ( string.match(pattern) ) { return true }
          return false
    }

    function error(error){
      error = error+". Consult Code List or Try Again."
      $("#msg").html(error)
    }



});
