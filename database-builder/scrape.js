var request = require('request');
var cheerio = require('cheerio');
var https = require('https');
var fs = require('fs');
var async = require('async');

var writeFileQueue = async.queue(function (task, callback) {
	var file = fs.readFileSync('db.json', 'utf8');	
	var dbJson = JSON.parse(file);
	console.log('after read dbjson=' + JSON.stringify(dbJson) + ' task=' + task);
	dbJson.heroes.push(task);
	console.log('to be written dbjson=' + JSON.stringify(dbJson));
	fs.writeFileSync('db.json', JSON.stringify(dbJson, null, 2), 'utf8', function(err) {
		if(err) {
			return console.log('error writing file='+err);
		}
		// console.log("The file was saved.");
	});

    callback();
}, 1);

writeFileQueue.drain = function() {
    console.log('All items have been written into file');
}

fs.writeFileSync('db.json', JSON.stringify({heroes: []}, null, 2), 'utf8', function(err) {
	if(err) {
		return console.log('error writing file='+err);
	}
	// console.log("The file was saved.");
});

request('https://www.icy-veins.com/heroes/', function(error, response, html) {
	if (!error && response.statusCode == 200) {
		var loadedHTML = cheerio.load(html);
		
		getHeroCategory(loadedHTML, 'assassins');
		getHeroCategory(loadedHTML, 'warriors');
		getHeroCategory(loadedHTML, 'support');
		getHeroCategory(loadedHTML, 'specialists');
	} else {
		console.log('error requesting heroes = ' + error);
	}
});

function getHeroCategory(loadedHTML, heroCategory) {
	console.log('Retrieving category ' + heroCategory + '...');
	
	var $ = loadedHTML;
	$('#nav_' + heroCategory + '_section > div.nav_content_block.nav_content_block_heroes.nav_content_block_heroes_hero > div.nav_content_entries > div.nav_content_block_entry_heroes_hero > a > span:not(.free_rotation_marker)').each(function(i, element) {
		getHero($(this).text());
		//console.log('heroCategory -> this=' + $(this));
	});
}

function getHero(heroName) {
	console.log('Retrieving hero ' + heroName + '...');
	
	var hero = {
		name: heroName,
		counters: []
	};
	
	var heroUrl = heroName.replace(/'/g, '').replace(/ /g, '-').replace(/\./g, '').toLowerCase();
	console.log('heroUrl=' + heroUrl);
	var requestUrl = 'https://www.icy-veins.com/heroes/' + heroUrl + '-build-guide';
	request(requestUrl, function (error, response, html) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(html);
			$('div.heroes_tldr_matchups_countered_by > p').each(function(i, element){
				var reason = $(this).text();
				hero.reason = reason.replace(/\n/g, ' ');
			});
			$('div.heroes_tldr_matchups_countered_by').children('div.heroes_tldr_matchups_hero_list').find('img.hero_portrait_bad').each(function(i, element){
				var title = $(this).attr('title');
				prepareHeroQueue.push({title:title});
			});
		} else {
			console.log('error requesting hero ' + hero + ' = ' + error);
		}
	});
	
	var prepareHeroQueue = async.queue(function (task, callback) {
		var counter = {
			name: task.title
		};
		console.log('push ' + JSON.stringify(counter));
		hero.counters.push(counter);
		
		callback();
	}, 1);

	prepareHeroQueue.drain = function() {
		console.log('Hero ' + JSON.stringify(hero) + ' is ready to be written!');
		writeFileQueue.push(hero);
	}
}