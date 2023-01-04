const chart = d3.select("#chart");

chart
	.append("h1")
	.attr("id", "title")
	.text("United States Educational Attainment");

chart
	.append("h3")
	.attr("id", "description")
	.text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)");

const svg = chart
	.append('svg')
	.attr('width', 960)
	.attr('height', 600);

const tooltip = chart
	.append('div')
	.attr('id', 'tooltip')
	.style('opacity', 0)

const legend = svg
	.append('g')
	.attr('id', 'legend')
	.attr('transform', 'translate(0,30)');

var path = d3.geoPath();

const EDUCATION_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const USDATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

Promise.all([d3.json(USDATA_URL), d3.json(EDUCATION_URL)])
	.then((data) => callback(data[0], data[1]))
	.catch((err) => console.log(err));

function callback(usdata, education) {

	const educationMin = d3.min(education, (d) => d.bachelorsOrHigher);
	const educationMax = d3.max(education, (d) => d.bachelorsOrHigher);
	const educationStep = (educationMax - educationMin) / 8;

	const legendXScale = d3
		.scaleLinear()
		.domain([educationMin, educationMax])
		.range([600, 860]);

	const colorScale = d3
		.scaleThreshold()
		.domain(d3.range(educationMin, educationMax, educationStep))
		.range(d3.schemeYlGn[9]);

	legend
		.selectAll('rect')
		.data(colorScale.range().map((d) => colorScale.invertExtent(d)))
		.enter()
		.append('rect')
		.attr('height', 8)
		.attr('width', legendXScale(educationStep) - legendXScale(0))
		.attr('x', (d) => d[0] ? legendXScale(d[0]) : legendXScale(d[1] - educationStep))
		.attr('y', 10)
		.attr('fill', (d) => d[0] ? colorScale(d[0]) : colorScale(null))
		.attr('transform', 'translate(0, ' + (-10) + ')')

	legend.call(
		d3
			.axisBottom(legendXScale)
			.tickSize(12)
			.tickFormat((d) => Math.round(d) + '%')
			.tickValues([...colorScale.domain(), educationMax])

	)
		.select('.domain')
		.remove();

	svg
		.append('g')
		.selectAll('path')
		.data(topojson.feature(usdata, usdata.objects.counties).features)
		.enter()
		.append('path')
		.attr('class', 'county')
		.attr('data-fips', (d) => d.id)
		.attr('data-education', (d) => {
			const coincidence = education.filter((obj) => obj.fips === d.id);
			return coincidence[0] ? coincidence[0].bachelorsOrHigher : 0;
		})
		.attr('fill', (d) => {
			const coincidence = education.filter((obj) => obj.fips === d.id);
			return coincidence[0] ? colorScale(coincidence[0].bachelorsOrHigher) : colorScale(0);
		})
		.attr('d', path)
		.on('mousemove', (event, d) => {
			tooltip.style('opacity', 0.9);
			tooltip
				.html(() => {
					const coincidence = education.filter((obj) => obj.fips === d.id);
					if (coincidence[0]) {
						return (
							coincidence[0]['area_name'] + ', ' +
							coincidence[0]['state'] + ': ' +
							coincidence[0].bachelorsOrHigher + '%'
						);
					}
					else {
						return 0;
					}
				})
				.attr('data-education', () => {
					const coincidence = education.filter((obj) => obj.fips === d.id);
					return coincidence[0] ? coincidence[0].bachelorsOrHigher : 0;
				})
				.style('left', event.pageX + 15 + 'px')
				.style('top', event.pageY - 35 + 'px');
		})
		.on('mouseout', function () {
			tooltip.style('opacity', 0);
		});

	svg
		.append('path')
		.datum(topojson.mesh(usdata, usdata.objects.states, (a, b) => a !== b))
		.attr('class', 'states')
		.attr('d', path);
}