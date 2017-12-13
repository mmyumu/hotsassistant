const COUNTER_PATTERN = 'counter';
const SYNERGIE_PATTERN = 'synergie';
const MAP_PATTERN = 'map';
const LEVEL_PATTERN = 'level';
const ERROR_PATTERN = 'error';

var speechPatterns = { "fr": {}, "en":{}};
speechPatterns['fr'][COUNTER_PATTERN] = `{
   count, plural,
	=0 {Il n'y a pas de contre de {hero}.}
	one {Le contre de {hero} est {heroes}}
	other {Les contres de {hero} sont {heroes}}
}`;
speechPatterns['fr'][SYNERGIE_PATTERN] = `{
	count, plural,
	=0 {{hero} n'a de synergie avec aucun autre héro.}
	other {{hero} a une synergie avec {heroes}}
}`;
speechPatterns['fr'][MAP_PATTERN] = `{
	count, plural,
	=0 {Il n'y a pas de {level} map pour {hero}.}
	one{La {level} map de {hero} est {maps}.}
	other {Les {level}s maps de {hero} sont {maps}}
}`;
speechPatterns['fr'][LEVEL_PATTERN] = ` {
	level, select,
	fort {bonne}
	faible {mauvaise}
	other {level}
}`;
speechPatterns['fr'][ERROR_PATTERN] = `Je ne comprends pas ce que vous voulez dire par {action}`;

speechPatterns['en'][COUNTER_PATTERN] = `{
   count, plural,
	=0 {There is no counter for {hero}.}
	one {The counter for {hero} is {heroes}}
	other {The counters for {hero} are {heroes}}
}`;
speechPatterns['en'][SYNERGIE_PATTERN] = `{
	count, plural,
	=0 {{hero} has no synergy.}
	other {{hero} has synergy with {heroes}}
}`;
speechPatterns['en'][MAP_PATTERN] = `{
	count, plural,
	=0 {Il There is no {level} map for {hero}.}
	one{The {level} map for {hero} is {maps}.}
	other {The {level} maps for {hero} are {maps}}
}`;
speechPatterns['en'][LEVEL_PATTERN] = ` {
	level, select,
	fort {good}
	faible {bad}
	other {level}
}`;
speechPatterns['en'][ERROR_PATTERN] = `I do not understand what do you mean by {action}`;


module.exports = {
	get: function(lang) {
		return speechPatterns[lang];
	}
}