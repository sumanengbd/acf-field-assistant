const fs = require('fs');
const path = require('path');

async function main() {
	const sharp = require('sharp');
	const svgPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.svg');
	const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
	const svg = fs.readFileSync(svgPath);

	const sizes = [16, 48, 128, 512];

	for (const size of sizes) {
		const output = path.join(iconsDir, `icon-${size}.png`);
		await sharp(svg)
			.resize(size, size)
			.png({ compressionLevel: 9 })
			.toFile(output);
		console.log(`Generated ${output}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
