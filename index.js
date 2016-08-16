$(document).ready(function() {
	init();
	syncScroll();
});

function init() {
	var dataArray = JSON.parse(loadURL('./data.json'))
		.sort(function(a, b) {
			return moment(a.StartDate) - moment(b.StartDate);
		});

	createSidebarTable(dataArray);
	buildTable(dataArray);

	filter(dataArray);
}

function filterByTeamName(inputArr, name) {

	return inputArr.filter(function(o) {
		var arr = [];

		if(o.Team === name) {
			arr.push(o);
		} else {
			return;
		}

		return arr;
	});
}

function filter(dataArray) {
	var filterForm = $('.filter-form'),
		filterSelect = filterForm.find('#team-filter');

		filterSelect.on('change', function() {
			var filterSelectValue = filterSelect.val();

			if (filterSelectValue !== "All") {
				var filteredArr = filterByTeamName(dataArray, filterSelectValue);

				createSidebarTable(filteredArr);
				buildTable(filteredArr);
			} else {
				createSidebarTable(dataArray);
				buildTable(dataArray);
			}
		});
}

function createSidebarTable(dataArray) {
	var calendar = $('.calendar'),
		asideTableHeading = calendar.find('.sidebar-header tr'),
		asideTableBody = calendar.find('.calendar-sidebar tbody');

	var arr = dataArray
		.map(function (o) {
			return {
				Name: o.Name,
				Team: o.Team,
				Link: o.Link
			};
		});

	asideTableHeading.html('');
	
	for (var key in arr[0]) {
		asideTableHeading.append('<th>' + key + '</th>');
	}

	var table = '';

	for (var i = 0; i < arr.length; i++) {
		table+=fillRow(arr[i]);
	}

	asideTableBody.html('');
	asideTableBody.append(table);
}

function fillRow(dataRow) {
	var row = '<tr>';

	for (var key in dataRow) {

		if(dataRow[key] === null) {
			row+='<td></td>';
		} else if(key === 'Link') {
			row+='\
			<td>\
				<div class="truncate">\
					<a href="'+ dataRow[key] +'" title="'+  dataRow[key] + '">' + dataRow[key] + '</a>\
				</div>\
			</td>';
		} else {
			row+='<td><div class="truncate" title="'+  dataRow[key] + '">' + dataRow[key] + '</div></td>';
		}
	}

	return row+'</tr>';
}

function buildTable(dataArray) {
	var arr = dataArray.slice()
		.map(function(o) {
			return {
				start: moment(o.StartDate).startOf('isoWeek'),
				end: moment(o.DueDate).endOf('isoWeek')
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
						doing: false
					};
				});
			var d = moment(o.start);

			while (d < o.end) {
				row[Math.round( moment.duration(d.diff(min)).asWeeks() )].doing = true;
				d.isoWeek(d.isoWeek() + 1);
			}

			return row;
		});
	_destroy();
	_render(headRow, body);
}

function _destroy() {
	$('.calendar-header tr').html('');
	$('.calendar-content tbody').html('');
}

function _render(head, body) {
	$('.calendar-header tr').append(
		head.map(function(v) {
			var month = v.month ? ['<span class="month">', v.month ,'</span>'].join('') : '';
			return ['<th class="', v.startOfMonth ? 'start-of-month' : '', '"><div class="week">', v.week, month , '</div></th>'].join('');
		}).join('')
	);

	$('.calendar-content tbody').append(
		body.map(function(row) {
			return ['<tr>',row.map(function(v) {
				var classes = [(v.doing ? 'doing' : ''), (v.startOfMonth ? 'start-of-month' : '')].join(' ');
				return ['<td class="' + classes + '">', '</td>'].join('');
			}), '</tr>'].join('');
		})
	)
}

function _generateHead(start, end) {
	var row = [];
	var currMonth = '';
	var curr = moment(start);

	while(curr < end) {
		var cell = { week: curr.isoWeek()};

		if (currMonth !== curr.format('MMMM')) {
			currMonth = cell.month = curr.format('MMMM');
			cell.startOfMonth = true;
		}
 
		row.push( cell);
		curr.isoWeek(curr.isoWeek() + 1);
	}

	return row;
}

function loadURL(url) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', url, false);
	xhr.send(null);

	return xhr.responseText;
}

function syncScroll() {
	var calendar = $('.calendar'),
	mainTable = calendar.find('.calendar-content'),
	headerTable = calendar.find('.calendar-header table'),
	asideTable = calendar.find('.calendar-sidebar table');

	mainTable.on('scroll', function() {
		asideTable.css('margin-top', -mainTable.scrollTop());
		headerTable.css('margin-left', -mainTable.scrollLeft());
	});
}