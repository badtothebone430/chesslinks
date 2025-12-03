// openings-tags-analysis.js
// Analyze openings.json for tag statistics

const fs = require('fs');
const openings = JSON.parse(fs.readFileSync('openings.json', 'utf-8'));

// Count tags per opening
let maxTags = 0;
let openingsWithMostTags = [];
const tagCounts = {};

openings.forEach(o => {
    const numTags = o.tags.length;
    if (numTags > maxTags) {
        maxTags = numTags;
        openingsWithMostTags = [o];
    } else if (numTags === maxTags) {
        openingsWithMostTags.push(o);
    }
    o.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
});

// Sort tags by frequency
const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

console.log('Openings with the most tags (' + maxTags + ' tags):');
openingsWithMostTags.forEach(o => {
    console.log('- ' + o.name + ': [' + o.tags.join(', ') + ']');
});

console.log('\nMost common tags:');
sortedTags.slice(0, 10).forEach(([tag, count]) => {
    console.log(tag + ': ' + count);
});

console.log('\nRarest tags:');
sortedTags.slice(-10).forEach(([tag, count]) => {
    console.log(tag + ': ' + count);
});
