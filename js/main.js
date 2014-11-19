/**
Copyright (c) 2014, Ben Dilday
bepd50 at gmail dot com
**/

// globals

var xScale, yScale;
var xAxis = 'fWar', yAxis = 'rwa3';
var fdata;
var rdata;
var minyear ;//= 1851;
var maxyear ;//= 2010;
var slope;// = 45;
var nplayer;// = 50;
var oset = 0;
var descriptions;
var inp_yrType = 'playing';
//var yearSelKeys = {"playing":"year_id", "birth":"year_birth"};
var yearSelKeys = {"playing":"minyr", "birth":"birthYear"};
var bounds;

//// RENDERING FUNCTIONS

function updatePlayerLists(nin, nclose) {    
    d3.select('#playerList')
	.text('player list ' + nin.length)
	.style({'font-size': '12px'});
    d3.select('#playerList')
	.selectAll('li')
	.data(nin)
	.enter()
	.append('li')
	.text(function(d) {return d.pname;})
	.style({'font-size': '10px'})
    	.on('mouseover', function(d) {
	    d3.select('svg g.chart #playerLabel')
		.text(d.pname)
		.transition()
		.style('fill', '#555')
		.style('opacity', 1)
		.style('font-size', "40px")
		.attr('x', xScale(d[xAxis]))
		.attr('y', yScale(d[yAxis]))
	    ;
	})
	.on('mouseout', function(d) {
	    d3.select('svg g.chart #playerLabel')
		.transition()
		.duration(1500)
		.style('opacity', 0);
	});
    

    d3.select('#playerListClose')
	.text('player list close ' + nclose.length)
	.style({'font-size': '12px'});
    d3.select('#playerListClose')
	.selectAll('li')
	.data(nclose)
	.enter()
	.append('li')
	.text(function(d) {return d["pname"];})
	.style({'font-size': '10px'})
    	.on('mouseover', function(d) {
	    d3.select('svg g.chart #playerLabel')
		.text(d.pname)
		.transition()
		.style('fill', '#555')
		.style('opacity', 1)
		.style('font-size', "40px")
		.attr('x', xScale(d[xAxis]))
		.attr('y', yScale(d[yAxis]))
	    ;
	})
	.on('mouseout', function(d) {
	    d3.select('svg g.chart #playerLabel')
		.transition()
		.duration(1500)
		.style('opacity', 0);
	});
    
}

function updateChart(init, bounds) {
    updateScales(bounds);
    
    // Also update the axes
    d3.select('#xAxis')
	.transition()
	.call(makeXAxis);
    
    d3.select('#yAxis')
	.transition()
	.call(makeYAxis);
    
    // Update axis labels
    d3.select('#xLabel')
	.text(descriptions[xAxis]);
    
    d3.select('#yLabel')
	.text(descriptions[yAxis]);
    
    // Update correlation
    var xArray = _.map(fdata, function(d) {return d[xAxis];});
    var yArray = _.map(fdata, function(d) {return d[yAxis];});
    var c = getCorrelation(xArray, yArray);
    var x1 = xScale.domain()[0], y1 = c.m * x1 + c.b;
    var x2 = xScale.domain()[1], y2 = c.m * x2 + c.b;
    
    // Fade in
    /**
     **/ 
    d3.select('#bestfit')
	.style('opacity', 0)
	.attr({'x1': xScale(x1), 'y1': yScale(y1), 'x2': xScale(x2), 'y2': yScale(y2)})
	.transition()
	.duration(150)
	.style('opacity', 1);

    
    d3.select('svg g.chart')
	.selectAll('circle')
	.transition()
	.duration(500)
	.ease('quad-out')
	.attr('cx', function(d) {
	    return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
	})
	.attr('cy', function(d) {
	    return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
	})
	.attr('r', function(d) {
	    return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : (d['ihof']>=1 ? 5 : 5)
	})
	.attr('stroke-width', function(d) {
	    return d["ithisyear"] ? 1.5 : (d['ihof']==0 ? 0 : (d['ihof']==1 ? 1.5 : 1.5));
	})
	.attr('stroke', d3.rgb(25, 25, 25))
	.style('opacity', function(d) {
	    return d['ihof']==0.1 ? 1 : (d['ihof']==1 ? 1 : 0.5);
	})
    
    ;	
    
    drawSlopey(slope, oset);
    var tmp = getIn(fdata, slope, oset, minyear, maxyear);
    var nin = tmp[0];
    var nclose = tmp[1];

    updatePlayerLists(nin, nclose);  
       
}


function updateScales(bounds) {
    xScale = d3.scale.linear()
        .domain([bounds[xAxis].min, bounds[xAxis].max])
        .range([20, 780]);
    
    yScale = d3.scale.linear()
        .domain([bounds[yAxis].min, bounds[yAxis].max])
        .range([600, 100]);    
}

function makeXAxis(s) {
    s.call(d3.svg.axis()
	   .scale(xScale)
	   .orient("bottom"));
}

function makeYAxis(s) {
    s.call(d3.svg.axis()
	   .scale(yScale)
	   .orient("left"));
}

function updateMenus() {
    d3.select('#x-axis-menu-l')
	.selectAll('li')
	.classed('selected', function(d) {
	    return d === xAxis;
	});
    d3.select('#x-axis-menu-r')
	.selectAll('li')
	.classed('selected', function(d) {
	    return d === xAxis;
	});
    d3.select('#y-axis-menu-l')
	.selectAll('li')
	.classed('selected', function(d) {
	    return d === yAxis;
	});
    d3.select('#y-axis-menu-r')
	.selectAll('li')
	.classed('selected', function(d) {
	    return d === yAxis;
	});
}


// HELPERS
function parseData(d) {
    var keys = _.keys(d[0]);
    return _.map(d, function(d) {
	var o = {};
	_.each(keys, function(k) {
	    if( k == 'player_id' )
		o[k] = d[k];
	    else if( k == 'pname' ) 
		o[k] = d[k];
	    else
		o[k] = parseFloat(d[k]);
	});
	return o;
    });
}

function filterData(data, minyear, maxyear, filtType) {
    var sk = yearSelKeys[inp_yrType];
    var tdata = [];
    for (var i = 0; i < data.length; i++) {
	d = data[i]
	var keys = _.keys(d);
	var tmp = {};

	if (d[sk]>=minyear && d[sk]<=maxyear) {
	    for(var ik=0;ik<keys.length;ik++) {
		tmp[keys[ik]] = d[keys[ik]]; 
	    }
	    tdata.push(tmp);
	}
    }
    return tdata;
}
    
function getBounds(d, paddingFactor) {
    // Find min and maxes (for the scales)
    paddingFactor = typeof paddingFactor !== 'undefined' ? paddingFactor : 1;
    
    
    var keys = _.keys(d[0]), b = {};
    _.each(keys, function(k) {
	b[k] = {};
	_.each(d, function(d) {
	    if(isNaN(d[k]))
		return;
	    if(b[k].min === undefined || d[k] < b[k].min)
		b[k].min = d[k];
	    if(b[k].max === undefined || d[k] > b[k].max)
		b[k].max = d[k];
	});
	b[k].max > 0 ? b[k].max *= paddingFactor : b[k].max /= paddingFactor;
	b[k].min > 0 ? b[k].min /= paddingFactor : b[k].min *= paddingFactor;
    });
//    console.log(b);
    return b;
}

function getCorrelation(xArray, yArray) {
    function sum(m, v) {return m + v;}
    function sumSquares(m, v) {return m + v * v;}
    function filterNaN(m, v, i) {isNaN(v) ? null : m.push(i); return m;}
    
    // clean the data (because we know that some values are missing)
    var xNaN = _.reduce(xArray, filterNaN , []);
    var yNaN = _.reduce(yArray, filterNaN , []);
    var include = _.intersection(xNaN, yNaN);
    var fX = _.map(include, function(d) {return xArray[d];});
    var fY = _.map(include, function(d) {return yArray[d];});
    
    var sumX = _.reduce(fX, sum, 0);
    var sumY = _.reduce(fY, sum, 0);
    var sumX2 = _.reduce(fX, sumSquares, 0);
    var sumY2 = _.reduce(fY, sumSquares, 0);
    var sumXY = _.reduce(fX, function(m, v, i) {return m + v * fY[i];}, 0);
    
    var n = fX.length;
    var ntor = ( ( sumXY ) - ( sumX * sumY / n) );
    var dtorX = sumX2 - ( sumX * sumX / n);
    var dtorY = sumY2 - ( sumY * sumY / n);
    
    var r = ntor / (Math.sqrt( dtorX * dtorY )); // Pearson ( http://www.stat.wmich.edu/s216/book/node122.html )
    var m = ntor / dtorX; // y = mx + b
    var b = ( sumY - m * sumX ) / n;
    
    // console.log(r, m, b);
    return {r: r, m: m, b: b};
}

function getLineLimits(slope, oset) {
    var ang = slope*3.14159/180;
    var xp = 0.5*(xScale.domain()[0]+xScale.domain()[1]) + oset*Math.sin(ang);
    var yp = 0.5*(yScale.domain()[0]+yScale.domain()[1]) + oset*Math.cos(ang);
    var k = Math.tan(slope*3.14159/180);

    var sx1 = xScale.domain()[0];
    var sx2 = xScale.domain()[1];
    var sy1 = (xp-sx1)*k + yp;
    var sy2 = (xp-sx2)*k + yp;


    k = (sy2-sy1)/(sx2-sx1);

    var y0 = sy1 - k*sx1;
//    console.log(k);
    return {k: k, y0: y0, sx1: sx1, sx2: sx2, sy1: sy1, sy2: sy2};
}


function getDistPoint(d, slope, oset) {
    var aa = getLineLimits(slope, oset);
    var x = d[xAxis];
    var y = d[yAxis];
    var dy = y - aa['k']*x - aa['y0'];
    var sc = Math.sqrt(1+aa['k']*aa['k']);
    var dd = dy/sc;
    return dd;

}


function getIn(tdata, slope, oset, minyear, maxyear) {
    var d = [];
    var aa = getLineLimits(slope, oset);
    var nin = [];
    var nclose = [];
    var tmp = [];
    var xx, yy, ytest;
    for (var i = 0; i < tdata.length; i++) {
	d = tdata[i];
	var dd = getDistPoint(d, slope, oset);

	if(d[yearSelKeys[inp_yrType]]<minyear)
	    continue;

	if(d[yearSelKeys[inp_yrType]]>maxyear)
	    continue;

	xx = d[xAxis];
	yy = d[yAxis];
	ytest = aa['k']*xx + aa['y0'];

	if (dd>=0) {
	    nin.push(d);
	} else {
	    tmp.push([dd, d]);
	}

    }

    tmp.sort(function(a,b){
	a = a[0];
	b = b[0];
	return b-a;});

    var tl = tmp.length;
    if (tl>10) {
	tl = 10;
    }

    for (var i=0; i<tl; i++) {
	nclose.push(tmp[i][1]);
    }

    return [nin, nclose, nin.length];
}


function rotateData(data, ang) {
    var c = Math.cos(ang*3.14159/180);
    var s = Math.sin(ang*3.14159/180);
    for (var i=0;i<data.length;i++) {
	d = data[i];
	var x = d[xAxis];
	var y = d[yAxis];
	var xp =  c*x + s*y; 
	var yp = -s*x + c*y; 
	rdata[xAxis] = xp;
	rdata[yAxis] = yp;
    }
    return rdata;

}

function fitOset(fdata, slope, nplayer) {
    var xmin = xScale.domain()[0];
    var xmax = xScale.domain()[1];
    var x0 = 0.5*(xmax+xmin);
    var t = 0;
    var tmp, nin;
    var maxit = 400;
    var nit = 0;
    var toset = 0;

    xmin = -100;
    xmax = 100;

    var dx = 0.5;

    if (nplayer>fdata.length) {
	return -100;
    }

    np = -100;
    while(np!=nplayer && nit<maxit) {
	tmp = getIn(fdata, slope, toset, minyear, maxyear);
	np = tmp[2];

//	console.log(nit, xmin, xmax, toset, np);

	if (np<nplayer) { 	// move to left
	    toset = toset - dx ;
	} else if(np>nplayer) { 	// move to right
	    toset = toset + dx;
	}
	nit += 1;
    }
    
    return toset;	
}


function readInputs() {
    var slope = document.getElementById("inp_slope").value;
    var nplayer = document.getElementById("inp_nplayer").value;
    var minyear = document.getElementById("inp_minyear").value;
    var maxyear = document.getElementById("inp_maxyear").value;
    var inp_yrType = '';
    
    if (document.getElementById('r1').checked) {
	inp_yrType = document.getElementById('r1').value;
    } else if (document.getElementById('r2').checked) {
	inp_yrType = document.getElementById('r2').value;
    }

    if(slope<0)
	slope = 0;
    else if(slope>90)
	slope = 90;

    if (nplayer<1)
	nplayer = 1;

    if(minyear<1871)
	minyear = 1871;
    else if(minyear>2010)
	minyear = 2010;

    if(maxyear<1871)
	maxyear = 1871;
    else if(maxyear>2010)
	maxyear = 2010;

    if (slope>89.99) 
	slope = 89.99;


    return {slope: slope, nplayer: nplayer, minyear: minyear, maxyear: maxyear, inp_yrType: inp_yrType};

}


/*************************/
function doStuff(lup) {

    d3.select("svg").remove();
    main();

}

/*************************/
function drawSlopey(slope, oset) {
    var aa = getLineLimits(slope, oset);
    sx1 = aa['sx1'];
    sx2 = aa['sx2'];
    sy1 = aa['sy1'];
    sy2 = aa['sy2'];

    d3.select('#slopey')
      .style('opacity', 0)
      .attr({'x1': xScale(sx1), 'y1': yScale(sy1), 'x2': xScale(sx2), 'y2': yScale(sy2)})
      .transition()
      .duration(150)
      .style('opacity', 0.2);

}


/*************************/
function main() {
    d3.csv('data/HOF_metrics.csv', function(data) {
	
	var xAxisOptions = ["fWar"
			    ,"fwa2"
			    ,"fwa3"
			    ,"fwa4"
			    ,"fwa5"
			    ,"fwa7"
			    ,"rWar"
			    ,"rwa2"
			    ,"rwa3"
			    ,"rwa4"
			    ,"rwa5"
			    ,"rwa7"
			    ,"hofmon"
			    ,"hofstd"
			    ,"poz100"
			   ];

	var yAxisOptions = ["fWar"
			    ,"fwa2"
			    ,"fwa3"
			    ,"fwa4"
			    ,"fwa5"
			    ,"fwa7"
			    ,"rWar"
			    ,"rwa2"
			    ,"rwa3"
			    ,"rwa4"
			    ,"rwa5"
			    ,"rwa7"
			    ,"hofmon"
			    ,"hofstd"
			    ,"poz100"
			   ];
	
	
	descriptions = {
	    "rWar" : "Career rWAR"
	    ,"fWar" : "Career fWAR"
	    ,"fwa2" : "Career non-negative fWA2"
	    ,"fwa3" : "Career non-negative fWA3"
	    ,"fwa4" : "Career non-negative fWA4"
	    ,"fwa5" : "Career non-negative fWA5"
	    ,"fwa6" : "Career non-negative fWA6"
	    ,"fwa7" : "Career non-negative fWA7"
	    ,"fwa8" : "Career non-negative fWA8"
	    ,"rwa2" : "Career non-negative rWA2"
	    ,"rwa3" : "Career non-negative rWA3"
	    ,"rwa4" : "Career non-negative rWA4"
	    ,"rwa5" : "Career non-negative rWA5"
	    ,"rwa6" : "Career non-negative rWA6"
	    ,"rwa7" : "Career non-negative rWA7"
	    ,"rwa8" : "Career non-negative rWA8"
	    ,"hofmon" : "Bill James HOF monitor"
	    ,"hofstd" : "Bill James HOF standards"
	};
	

	var keys = _.keys(data[0]);	
	var data = parseData(data);

	var aa = readInputs(); 
	slope = aa['slope'];
	minyear = aa['minyear'];
	maxyear = aa['maxyear'];
	inp_yrType = aa['inp_yrType'];
	nplayer = aa['nplayer'];

	fdata = filterData(data, minyear, maxyear, inp_yrType );
	bounds = getBounds(fdata, 1);
	updateScales(bounds);

	oset = fitOset(fdata, slope, nplayer);

	// SVG AND D3 STUFF
	var svg = d3.select("#chart")
	    .append("svg")
	    .attr("width", 1000)
	    .attr("height", 640);
	
	svg.append('g')
	    .classed('chart', true)
	    .attr('transform', 'translate(80, -60)');
	
	// Build menus
	d3.select('#x-axis-menu-l')
	    .selectAll('li')
	    .data(xAxisOptions)
	    .enter()
	    .append('li')
	    .text(function(d) {return d;})
	    .classed('selected', function(d) {
		return d === xAxis;
	    })
	    .on('click', function(d) {
		xAxis = d;
		updateChart(false, bounds);
		updateMenus();
	    });
	
	d3.select('#y-axis-menu-l')
	    .selectAll('li')
	    .data(yAxisOptions)
	    .enter()
	    .append('li')
	    .text(function(d) {return d;})
	    .classed('selected', function(d) {
		return d === yAxis;
	    })
	    .on('click', function(d) {
		yAxis = d;
		updateChart(false, bounds);
		updateMenus();
	    });
	
	// Player name
	d3.select('svg g.chart')
	    .append('text')
	    .attr({'id': 'playerLabel', 'x': 60, 'y': 60})
	    .style({'font-size': '40px', 'fill': '#ddd'});
	
	// Best fit line (to appear behind points)
	d3.select('svg g.chart')
	    .append('line')
	    .attr('id', 'bestfit');
	
	// Slopey line
	d3.select('svg g.chart')
	    .append('line')
	    .attr('id', 'slopey');
	
	// Axis labels
	d3.select('svg g.chart')
	    .append('text')
	    .attr({'id': 'xLabel', 'x': 400, 'y': 670, 'text-anchor': 'middle'})
	    .text(descriptions[xAxis]);
	
	d3.select('svg g.chart')
	    .append('text')
	    .attr('transform', 'translate(-60, 330)rotate(-90)')
	    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
	    .text(descriptions[yAxis]);
	
	
	//  var pointColour = d3.scale.category20b();
	var pointColour = ["red","blue"];	

	//  tdata = d3.selectAll
	d3.select('svg g.chart')
	    .selectAll('circle')
	    .data(fdata)
	    .enter()
	    .append('circle')
	    .attr('cx', function(d) {
		return isNaN(d[xAxis]) ? 
		    d3.select(this).attr('cx') : 
		    xScale(d[xAxis]);
	    })
	    .attr('cy', function(d) {
		return isNaN(d[yAxis]) ? 
		    d3.select(this).attr('cy') : 
		    yScale(d[yAxis]);
	    })
	    .attr('fill', function(d, i) {
		return d["ithisyear"]==1 ? 
		    "#FFFF66" : 
		    pointColour[d["ibat"]]
		;})

	    .style('cursor', 'pointer')
	    .on('mouseover', function(d) {
		d3.select('svg g.chart #playerLabel')
		    .text(d.pname)
		    .transition()
		    .style('fill', '#555')
		    .style('opacity', 1)
		    .style('font-size', "40px")
		    .attr('x', xScale(d[xAxis]))
		    .attr('y', yScale(d[yAxis]))
		;
	    })
	    .on('mouseout', function(d) {
		d3.select('svg g.chart #playerLabel')
		    .transition()
		    .duration(1500)
		    .style('opacity', 0);
	    });

	updateChart(true, bounds);
	updateMenus();
	
	// Render axes
	d3.select('svg g.chart')
	    .append("g")
	    .attr('transform', 'translate(0, 630)')
	    .attr('id', 'xAxis')
	    .call(makeXAxis);
	
	d3.select('svg g.chart')
	    .append("g")
	    .attr('id', 'yAxis')
	    .attr('transform', 'translate(-10, 0)')
	    .call(makeYAxis);
    })}


main();
	   
