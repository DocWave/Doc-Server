

(function (globals) {

  var django = globals.django || (globals.django = {});

  
  django.pluralidx = function (count) { return (count == 1) ? 0 : 1; };
  

  
  /* gettext identity library */

  django.gettext = function (msgid) { return msgid; };
  django.ngettext = function (singular, plural, count) { return (count == 1) ? singular : plural; };
  django.gettext_noop = function (msgid) { return msgid; };
  django.pgettext = function (context, msgid) { return msgid; };
  django.npgettext = function (context, singular, plural, count) { return (count == 1) ? singular : plural; };
  

  django.interpolate = function (fmt, obj, named) {
    if (named) {
      return fmt.replace(/%\(\w+\)s/g, function(match){return String(obj[match.slice(2,-2)])});
    } else {
      return fmt.replace(/%s/g, function(match){return String(obj.shift())});
    }
  };


  /* formatting library */

  django.formats = {
    "DATETIME_FORMAT": "j N Y, G.i.s", 
    "DATETIME_INPUT_FORMATS": [
      "%d-%m-%Y %H.%M.%S", 
      "%d-%m-%Y %H.%M.%S.%f", 
      "%d-%m-%Y %H.%M", 
      "%d-%m-%Y", 
      "%d-%m-%y %H.%M.%S", 
      "%d-%m-%y %H.%M.%S.%f", 
      "%d-%m-%y %H.%M", 
      "%d-%m-%y", 
      "%m/%d/%y %H.%M.%S", 
      "%m/%d/%y %H.%M.%S.%f", 
      "%m/%d/%y %H.%M", 
      "%m/%d/%y", 
      "%m/%d/%Y %H.%M.%S", 
      "%m/%d/%Y %H.%M.%S.%f", 
      "%m/%d/%Y %H.%M", 
      "%m/%d/%Y", 
      "%Y-%m-%d %H:%M:%S", 
      "%Y-%m-%d %H:%M:%S.%f", 
      "%Y-%m-%d %H:%M", 
      "%Y-%m-%d"
    ], 
    "DATE_FORMAT": "j N Y", 
    "DATE_INPUT_FORMATS": [
      "%d-%m-%y", 
      "%d/%m/%y", 
      "%d-%m-%Y", 
      "%d/%m/%Y", 
      "%d %b %Y", 
      "%d %B %Y", 
      "%Y-%m-%d"
    ], 
    "DECIMAL_SEPARATOR": ",", 
    "FIRST_DAY_OF_WEEK": "1", 
    "MONTH_DAY_FORMAT": "j F", 
    "NUMBER_GROUPING": "3", 
    "SHORT_DATETIME_FORMAT": "d-m-Y G.i.s", 
    "SHORT_DATE_FORMAT": "d-m-Y", 
    "THOUSAND_SEPARATOR": ".", 
    "TIME_FORMAT": "G.i.s", 
    "TIME_INPUT_FORMATS": [
      "%H.%M.%S", 
      "%H.%M", 
      "%H:%M:%S", 
      "%H:%M:%S.%f", 
      "%H:%M"
    ], 
    "YEAR_MONTH_FORMAT": "F Y"
  };

  django.get_format = function (format_type) {
    var value = django.formats[format_type];
    if (typeof(value) == 'undefined') {
      return format_type;
    } else {
      return value;
    }
  };

  /* add to global namespace */
  globals.pluralidx = django.pluralidx;
  globals.gettext = django.gettext;
  globals.ngettext = django.ngettext;
  globals.gettext_noop = django.gettext_noop;
  globals.pgettext = django.pgettext;
  globals.npgettext = django.npgettext;
  globals.interpolate = django.interpolate;
  globals.get_format = django.get_format;

}(this));

