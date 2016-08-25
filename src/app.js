var $ = require('jquery');
var moment = require('moment');

$(document).ready(function() {
	init();
});

function init() {
	var dataArray = JSON.parse(loadURL('./data.json'))
		.sort(function(a, b) {
			return moment(a.StartDate) - moment(b.StartDate);
		});

	$('#team-filter').on('change', function() {
		var filter = this.value;
		var renderData = filter === 'All' ? dataArray : dataArray.filter(_matchLater('Team', filter));

		_render(renderData);
	});

	_createFilter(dataArray);
	_render(dataArray);

	function _matchLater(propName, propValue) {
		return function(o) {
			return o[propName] === propValue;
		}
	}
}


function _render(dataArray) {
	_destroy();

	_showChart(dataArray);
	_showTable(dataArray);

	syncScroll();
}

function _destroy() {
	$('.data-table thead tr').html('');
	$('.data-table tbody').html('');
	$('.chart-header tr').html('');
	$('.chart-content tbody').html('');
}

///// Filter

function _createFilter(dataArray) {
	var filterData = _getFilterData(dataArray);
	_renderFilter(filterData);
}

function _getFilterData(dataArray) {
	var filterOptions = [];
	var currName = '';

	var arr = dataArray
		.map(function (o) {
			return o.Team;
		})
		.sort()
		.map(function(str) {
		if(currName !== str) {
			filterOptions.push(str);
			currName = str;
		}
	});
	return filterOptions;
}

function _renderFilter(filterData) {
	$('#team-filter').append(
		filterData.map(function(str) {
			return ['<option value="', str, '">', str , '</option>'].join('');
		}).join('')
	);
}

///// Chart

function _showChart(dataArray) {
	var chartData = _getChartData(dataArray);
	_renderChart(chartData.head, chartData.body);
}

function _getChartData(dataArray) {
	var today = moment();
	var arr = dataArray.slice()
		.map(function(o) {

			return {
				start: moment(o.StartDate).startOf('isoWeek'),
				end: moment(o.DueDate).endOf('isoWeek'),
				status: o.Status,
				isEstimated: o.IsProgamaticallyEstimated
			}
		});

	var min = moment.min( arr.map(function(o){ return o.start }) );

	var max = moment.max( arr.map(function(o){ return o.end }) );

	var date = moment(min);
	var headRow = _generateHead(min, max);

	var body = arr
		.map(function(o) {
			var row = headRow
				.map(function(o) {
					return {
						startOfMonth: o.startOfMonth,
						doing: false,
						status: '',
						isEstimated: ''
					};
				});
			var d = moment(o.start);

			while (d < o.end) {
				var numOfRow = Math.round(moment.duration(d.diff(min)).asWeeks());

				row[numOfRow].doing = true;
				row[numOfRow].status = o.status;
				row[numOfRow].isEstimated = o.isEstimated;

				d.isoWeek(d.isoWeek() + 1);
			}


			return row;
		});

	return {head: headRow, body: body};

	///////////////////////////////////

	function _generateHead(start, end) {
		var row = [];
		var currMonth = '';
		var curr = moment(start);

		while(curr < end) {
			var cell = { 
				week: curr.isoWeek()
			};

			if (currMonth !== curr.format('MMMM')) {
				currMonth = cell.month = curr.format('MMMM');
				cell.startOfMonth = true;
			} 
			if(curr.isSame(today, 'month')) {
				cell.currWeek = true;
			}
	 
			row.push( cell);
			curr.isoWeek(curr.isoWeek() + 1);
		}

		return row;
	}
}

function _renderChart(head, body) {
	$('.chart-header tr').append(
		head.map(function(v) {
			var month = v.month ? ['<span class="month">', v.month ,'</span>'].join('') : '';
			var classes = [
				v.startOfMonth ? 'start-of-month' : '',
				v.currWeek ? 'current-week' : ''
			].join(' ');
			var content = ['<div class="week">', v.week, month, '</div>'].join('');

			return ['<th class="', classes, '">', content, '</th>'].join('');
		}).join('')
	);

	$('.chart-content tbody').append(
		body.map(function(row) {
			return ['<tr>',
			row.map(function(v) {
				var classes = [(v.doing ? 'doing' : ''), _getStatus(v.status), (v.startOfMonth ? 'start-of-month' : '')].join(' ');
				var content = (v.isEstimated === "True") ? '<span class="is-estimated"></span>' : '';
				var title = (v.isEstimated === "True") ? ' (Estimated Progamatically)' : '';

				return ['<td class="' + classes + '" title="' + v.status + title + '">', content, '</td>'].join('');
			}),
			 '</tr>'].join('');
		})
	);



	function _getStatus(str) {
		var statuses = {
			"Design": "design",
			"Specification": "specification",
			"Backlog": "backlog",
			"Analysis": "analysis",
			"Development": "development",
			"ISIT": "isit",
			"Open": "open",
			"Ready for ISIT": "ready-for-isit"
		}

		return statuses[str];
	}
}

//// Table

function _showTable(dataArray) {
	var tableData = _getTableData(dataArray);
	_renderTable(tableData.head, tableData.body)
}

function _getTableData(dataArray) {
	var head = ['Team', 'Key', 'Name', 'Assignee', 'Project'];
	var today = moment();
	var _isStartShown = false;
	var body = dataArray
		.map(function(o) {
			return {
				isStartTask: !_isStartShown && (_isStartShown = today.isBetween(moment(o.StartDate), moment(o.DueDate))),
				cells: head.map(_getCellLater(o))
			};
		});

	return {head: head, body: body};

	function _getCellLater(o) {
		return function(key) {
			var value = o[key] || '';
			switch(key) {
				case 'Key':
					return {isLink: false, text: value.replace(/[^\d]/g, ''),title: value};
				case 'Team':
					return {isLink: false, text: value[0], title: value};
				case 'Name':
					return {isLink: true,  text: value, title: value, url: o.Link, truncate: true};
				case 'Project':
					return {isLink: false, text: _getShortProjectName(value), title: value};
				case 'Assignee':
					return {isLink: false, text: value.toUpperCase(), title: ''};
				default:
					return {isLink: false, text: value, title: ''};
			}

			function _getShortProjectName(value) {
				if(value) {
					var shortName = [];

					value.split(' ')
						.map(function(str) {
							shortName.push(str[0]);
						});

					return shortName.join('');
				} else {
					return '';
				}
			}
		}
	}
}

function _renderTable(head, body) {

	$('.data-table thead tr').append(
		head.map(function(o) {
			return ['<th><div class="name">' + o +'</div>', o ,'</th>'].join('');
		}).join('')
	);

	$('.data-table tbody').append(
		body.map(function(row) {
			return ['<tr class="'+ ( row.isStartTask ? 'current-task' : '')+'">', 
				row.cells.map(function(v) {
					var content = v.isLink ? '<a href="' +v.url+'">' +v.text+ '</a>' : v.text;
					if (v.truncate) {
						content = ['<div class="truncate-wrap"><div class="truncate">', content, '</div></div>'].join('');
					}
					return ['<td title="'+ v.title + '">', content, '</td>'].join('');
				}).join('')
			, '</tr>'].join('');
		}).join('')
	);

	///////////////////////

	function _generateRow(dataRow) {
		var row = [];

		for (var key in dataRow) {
			row.push('<td><div class="truncate" title="'+  dataRow[key] + '">' + dataRow[key] + '</div></td>');
		}

		return row;
	}
}

//// SyncScrolling

function syncScroll() {
	var calendar = $('.calendar'),
		mainTable = calendar.find('.chart-content'),
		headerTable = calendar.find('.chart-header table'),
		asideTable = calendar.find('.data-table-wrap');

	var defaultLeftPosition = headerTable.offset().left;
	var defaultTopPosition = asideTable.offset().top;

	var currLeftPosition = calendar.find('.current-week').offset().left;
	var currTopPosition = calendar.find('.current-task').offset().top;

	var offsetLeftSize = currLeftPosition - defaultLeftPosition;
	var offsetTopSize = currTopPosition - defaultTopPosition;

	headerTable.css('margin-left', -offsetLeftSize);
	mainTable.scrollLeft(offsetLeftSize);

	mainTable.scrollTop(offsetTopSize);
	asideTable.scrollTop(offsetTopSize);

	mainTable.on('scroll', function() {
		asideTable.scrollTop(mainTable.scrollTop());
		headerTable.css('margin-left', -mainTable.scrollLeft());
	});

	asideTable.on('scroll', function(){
		mainTable.scrollTop(asideTable.scrollTop());
	});
}

function loadURL(url) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', url, false);
	xhr.send(null);

	return xhr.responseText;
}