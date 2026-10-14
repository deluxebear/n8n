import type { BooleanLicenseFeature } from '@n8n/constants';
import { LICENSE_FEATURES, LICENSE_QUOTAS, UNLIMITED_LICENSE_QUOTA, Time } from '@n8n/constants';

import type { FeatureReturnType, License } from '@/license';

const DISABLED_FEATURES = new Set<BooleanLicenseFeature>([
	LICENSE_FEATURES.SHOW_NON_PROD_BANNER,
	LICENSE_FEATURES.API_DISABLED,
	LICENSE_FEATURES.AI_ASSISTANT,
	LICENSE_FEATURES.ASK_AI,
]);

export class EnterpriseLicenseMocker {
	private static instance: EnterpriseLicenseMocker;
	private readonly restorers = new WeakMap<License, () => void>();

	static getInstance(): EnterpriseLicenseMocker {
		if (!EnterpriseLicenseMocker.instance) {
			EnterpriseLicenseMocker.instance = new EnterpriseLicenseMocker();
		}
		return EnterpriseLicenseMocker.instance;
	}

	enableAllEnterpriseFeatures(license: License): void {
		if (this.restorers.has(license)) return;

		const originalIsLicensed = license.isLicensed;
		const originalGetValue = license.getValue;
		const originalReload = license.reload;
		const originalGetPlanName = license.getPlanName;
		const originalGetConsumerId = license.getConsumerId;
		const originalGetManagementJwt = license.getManagementJwt;
		const readOriginalValue = originalGetValue.bind(license);
		let lastReloadAt: number | undefined;

		const mockedValues: FeatureReturnType = { planName: 'Enterprise (Mocked)' };
		for (const quota of Object.values(LICENSE_QUOTAS)) {
			mockedValues[quota] = UNLIMITED_LICENSE_QUOTA;
		}
		mockedValues[LICENSE_QUOTAS.AI_CREDITS] = 999999;
		for (const feature of Object.values(LICENSE_FEATURES)) {
			mockedValues[feature] = true;
		}

		// LicenseState reads this provider. Legacy getters use the same values.
		license.isLicensed = (feature) => !DISABLED_FEATURES.has(feature);
		license.getValue = <T extends keyof FeatureReturnType>(feature: T): FeatureReturnType[T] =>
			feature in mockedValues ? mockedValues[feature] : readOriginalValue(feature);

		// Expiry callbacks can call reload again. Keep the original 72-hour limit.
		license.reload = async (): Promise<void> => {
			const now = Date.now();
			if (lastReloadAt !== undefined && now - lastReloadAt < 72 * Time.hours.toMilliseconds) {
				return;
			}
			lastReloadAt = now;
			await originalReload.call(license);
		};

		license.getPlanName = () => 'Enterprise (Mocked)';
		license.getConsumerId = () => 'enterprise-mock-consumer';
		license.getManagementJwt = () => 'mock-jwt-token';

		this.restorers.set(license, () => {
			license.isLicensed = originalIsLicensed;
			license.getValue = originalGetValue;
			license.reload = originalReload;
			license.getPlanName = originalGetPlanName;
			license.getConsumerId = originalGetConsumerId;
			license.getManagementJwt = originalGetManagementJwt;
		});

		console.log('[ENTERPRISE MOCK] All enterprise features enabled for testing');
	}

	restore(license: License): void {
		this.restorers.get(license)?.();
		this.restorers.delete(license);
		console.log('[ENTERPRISE MOCK] Original license methods restored');
	}

	static isDevelopmentEnvironment(): boolean {
		return (
			process.env.NODE_ENV !== 'production' &&
			(process.env.NODE_ENV === 'development' ||
				process.env.NODE_ENV === 'test' ||
				process.env.N8N_ENTERPRISE_MOCK === 'true')
		);
	}
}

export function enableEnterpriseMock(license: License): void {
	if (!EnterpriseLicenseMocker.isDevelopmentEnvironment()) {
		console.warn('[ENTERPRISE MOCK] Not in development environment, enterprise mock not enabled');
		return;
	}

	EnterpriseLicenseMocker.getInstance().enableAllEnterpriseFeatures(license);
}

export function disableEnterpriseMock(license: License): void {
	EnterpriseLicenseMocker.getInstance().restore(license);
}
