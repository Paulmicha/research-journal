
/**
 * @file
 * Contains service-related shared utilities for the Ecometrics experiment.
 */

import slugify from '@sindresorhus/slugify';
import { getSelectedItemSetting } from './selection';

/**
 * Returns service SVG code according to its type (subcategory).
 *
 * Contains hardcoded mappings to match some service names to particular icons.
 *
 * @param {Object} service : the service entity object.
 * @param {Object} servicesIcons : the loaded data containing inline SVG markup.
 * @return {String} the icon SVG inline markup.
 */
export const getServiceImg = (service, servicesIcons) => {
	if (!servicesIcons) {
		return '';
	}
	let iconName = slugify(service.name, { separator: '' });
	if (iconName.includes('google')) {
		iconName = 'google';
	} else if (iconName.includes('amazon')) {
		iconName = 'aws';
	} else if (iconName.includes('microsoft')) {
		iconName = 'microsoft';
	}
	if (!(iconName in servicesIcons)) {
		return servicesIcons.default;
	}
	return servicesIcons[iconName];
};

/**
 * Estimates power consumption based on RAM and CPU stress.
 *
 * "the GHG Protocol is not suitable for customers to assess the emissions of
 * their IT environments located in the public cloud because the required
 * information to calculate emissions is not provided by Cloud Vendors."
 * https://journalofcloudcomputing.springeropen.com/articles/10.1186/s13677-020-00185-8
 *
 * "Even if cloud providers work on Energy-Proportional Computing strategies
 * to minimize wastage, our measurements show that once the instance is
 * available to us its power consumption can be significant, even when idle
 * (power overhead)."
 * See https://medium.com/teads-engineering/estimating-aws-ec2-instances-power-consumption-c9745e347959
 *
 * We make pretty harsh assumptions here to represent something that is
 * apparently impossible to measure due to vendors not having or releasing the
 * necessary data.
 *
 * @param {Object} selectedService the entity object "decorated" with settings.
 */
export const estimateCloudConsumption = selectedService => {
	// We'll use the average gap in W/vCPU measures between idle and 100% from
	// Benjamin Davy's research + the same for W/GB for RAM.
	const awsEc2Measures = {
		cpu: {
			models: ['c5', 'm5', 'r5', 'z1d', 'm5zn'],
			low: [1.18, 1.15, 1.21, 0.99, 1.2],
			high: [4.03, 2.99, 3.61, 10.00, 10.68]
		},
		ram: {
			models: ['c5', 'm5', 'r5', 'z1d', 'm5zn'],
			low: [0.41, 0.26, 0.26, 0.27, 0.43],
			high: [1.16, 0.79, 0.61, 0.67, 0.96]
		}
	};
	// Automated tests : 75% ressources used ?
	if (getSelectedItemSetting(selectedService, 'useTests')) {
		const n = getSelectedItemSetting(selectedService, 'tests_per_month');
		const d = getSelectedItemSetting(selectedService, 'tests_duration');
		// TODO (wip)
	}
	// Backup : 25% ressources ?
	// Commits ?
};

/**
 * Estimates electricity intensity of transmission networks.
 *
 * (Excluding data centers and edge devices)
 *
 * "estimate of 0.06 kWh/GB for 2015 is a new estimate proposed in this study,
 * based on Krug and colleagues (2014) with updated data for 2015 from Krug
 * (2016). kWh/GB = kilowatt-hours per gigabyte."
 * See https://onlinelibrary.wiley.com/doi/full/10.1111/jiec.12630
 *
 * "However, this only considers external traffic on the internet – it does not
 * account for internal network traffic which makes up a significant amount of
 * data transfer and is doubling every 12–15  months. Mobile traffic is another
 * significant exclusion when 71% of the global population expected to have
 * mobile connectivity by 2023 and smartphone traffic growing 7% annually."
 * See https://journalofcloudcomputing.springeropen.com/articles/10.1186/s13677-020-00185-8
 *
 * @param {Object} selectedService the entity object "decorated" with settings.
 */
export const estimateDataTransferConsumption = selectedService => {
	if (getSelectedItemSetting(selectedService, 'useBackup')) {
		const d = getSelectedItemSetting(selectedService, 'backups_duration');
		const s = getSelectedItemSetting(selectedService, 'backups_total_size');
		// TODO (wip)
	}
};

/**
 * TODO aggregate all available estimates into a single result.
 *
 * @param {Object} selectedService the entity object "decorated" with settings.
 */
export const esimateServiceConsumption = selectedService => {};

// Eutrophisation, déchets, écotoxicité...
// 2 pahses : fabriation, usage
// 1 indicateur : GES
// -> il manque tout le reste
