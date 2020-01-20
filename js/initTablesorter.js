$(function() {
  $.tablesorter.themes.bootstrap = {
    // look here: http://getbootstrap.com/css/#tables
    table        : 'table table-bordered table-striped',
    caption      : 'caption',
    // header class names
    header       : 'bootstrap-header', // give the header a gradient background (theme.bootstrap_2.css)
    sortNone     : '',
    sortAsc      : '',
    sortDesc     : '',
    active       : '', // applied when column is sorted
    hover        : '', // custom css required - a defined bootstrap style may not override other classes
    // icon class names
    icons        : '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
    iconSortNone : 'bootstrap-icon-unsorted', // class name added to icon when column is not sorted
    iconSortAsc  : 'icon-chevron-up', // class name added to icon when column has ascending sort
    iconSortDesc : 'icon-chevron-down', // class name added to icon when column has descending sort
    filterRow    : '', // filter row class
    footerRow    : '',
    footerCells  : '',
    even         : '', // even row zebra striping
    odd          : ''  // odd row zebra striping
  };

  $("table")
    .on('initialized filterEnd', () => {
        let needColumns = []
        var total = 0;
        $(this).find('tbody tr:visible').each(function(){
            // find money in 2nd column
            total += parseFloat( $(this).find('td:eq(1)').text() );
        });
        $('.total').text(total);
    })
    .tablesorter({
      theme : "bootstrap", // mod 
      widthFixed: false,//true,
      headerTemplate : '{content} {icon}', // new in v2.7. Needed to add the bootstrap icon!

      widgets : [ "uitheme", "filter", "columns", "zebra", "math"],

      widgetOptions : {
        zebra : ["even", "odd"],
        columns: [ "primary", "secondary", "tertiary" ],
        filter_reset : ".reset",
        filter_hideFilters : true,

        math_data     : 'math', // data-math attribute
        math_ignore   : [0, 1],
        math_none     : 'N/A', // no matching math elements found (text added to cell)
        math_complete : function($cell, wo, result, value, arry) {
          var txt = '<span class="align-decimal">' +
            //( value === wo.math_none ? '' : '$ ' ) +
            result + '</span>';
          if ($cell.attr('data-math') === 'all-sum') {
            // when the "all-sum" is processed, add a count to the end
            return txt + ' (Sum of ' + arry.length + ' cells)';
          }
          return txt;
        },
        math_completed : function(c) {
          // c = table.config
          // called after all math calculations have completed
          console.log( 'math calculations complete', c.$table.find('[data-math="all-sum"]:first').text() );
        },
        // cell data-attribute containing the math value to use (added v2.31.1)
        math_textAttr : '',
        // see "Mask Examples" section
        math_mask     : '#,##0.00',
        math_prefix   : '', // custom string added before the math_mask value (usually HTML)
        math_suffix   : '', // custom string added after the math_mask value
        // event triggered on the table which makes the math widget update all data-math cells (default shown)
        math_event    : 'recalculate',
        // math calculation priorities (default shown)... rows are first, then column above/below,
        // then entire column, and lastly "all" which is not included because it should always be last
        math_priority : [ 'row', 'above', 'below', 'col' ],
        // set row filter to limit which table rows are included in the calculation (v2.25.0)
        // e.g. math_rowFilter : ':visible:not(.filtered)' (default behavior when math_rowFilter isn't set)
        // or math_rowFilter : ':visible'; default is an empty string
        math_rowFilter : ':visible'
      }
    })
    .tablesorterPager({
      container: $(".ts-pager"),
      cssGoto  : ".pagenum",
      removeRows: true,
      output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'
    });
});