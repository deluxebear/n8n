import { LicenseState } from '@n8n/backend-common';
import { LICENSE_FEATURES, LICENSE_QUOTAS, Time, UNLIMITED_LICENSE_QUOTA } from '@n8n/constants';
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { License } from '@/license';
import {
	EnterpriseLicenseMocker,
	disableEnterpriseMock,
	enableEnterpriseMock,
} from '@/license-mock-enterprise';

describe('EnterpriseLicenseMocker', () => {
	const mocker = EnterpriseLicenseMocker.getInstance();
	let license: MockProxy<License>;

	beforeEach(() => {
		license = mock<License>();
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		mocker.restore(license);
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		vi.useRealTimers();
	});

	it('provides mock features and quotas through LicenseState', () => {
		const state = new LicenseState();
		state.setLicenseProvider(license);
		mocker.enableAllEnterpriseFeatures(license);

		for (const quota of Object.values(LICENSE_QUOTAS)) {
			expect(state.getValue(quota)).toBe(
				quota === LICENSE_QUOTAS.AI_CREDITS ? 999999 : UNLIMITED_LICENSE_QUOTA,
			);
		}
		expect(state.getMaxUsers()).toBe(UNLIMITED_LICENSE_QUOTA);
		expect(state.getMaxAiCredits()).toBe(999999);
		expect(state.isSharingLicensed()).toBe(true);
		expect(state.isLicensed(LICENSE_FEATURES.SHOW_NON_PROD_BANNER)).toBe(false);
		expect(state.isLicensed(LICENSE_FEATURES.API_DISABLED)).toBe(false);
		expect(state.isAiAssistantLicensed()).toBe(false);
		expect(state.isAskAiLicensed()).toBe(false);
		expect(state.getValue('planName')).toBe('Enterprise (Mocked)');
	});

	it('restores all methods after repeated enable calls', () => {
		const originalMethods = {
			isLicensed: license.isLicensed,
			getValue: license.getValue,
			reload: license.reload,
			getPlanName: license.getPlanName,
			getConsumerId: license.getConsumerId,
			getManagementJwt: license.getManagementJwt,
		};
		mocker.enableAllEnterpriseFeatures(license);
		mocker.enableAllEnterpriseFeatures(license);
		mocker.restore(license);

		for (const key of Object.keys(originalMethods)) {
			expect(Reflect.get(license, key)).toBe(Reflect.get(originalMethods, key));
		}
	});

	it('limits reloads and starts a new window after restore', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		const reload = license.reload.mockResolvedValue();
		mocker.enableAllEnterpriseFeatures(license);
		await license.reload();
		await license.reload();
		expect(reload).toHaveBeenCalledTimes(1);

		vi.setSystemTime(72 * Time.hours.toMilliseconds);
		await license.reload();
		expect(reload).toHaveBeenCalledTimes(2);
		mocker.restore(license);
		mocker.enableAllEnterpriseFeatures(license);
		await license.reload();
		expect(reload).toHaveBeenCalledTimes(3);
	});

	it('keeps reload windows separate for each license', async () => {
		const other = mock<License>();
		const firstReload = license.reload.mockResolvedValue();
		const otherReload = other.reload.mockResolvedValue();
		try {
			mocker.enableAllEnterpriseFeatures(license);
			mocker.enableAllEnterpriseFeatures(other);
			await license.reload();
			await other.reload();
			expect(firstReload).toHaveBeenCalledOnce();
			expect(otherReload).toHaveBeenCalledOnce();
		} finally {
			mocker.restore(other);
		}
	});

	it('does not enable mocks in production', () => {
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('N8N_ENTERPRISE_MOCK', 'true');
		const original = license.isLicensed;
		enableEnterpriseMock(license);
		expect(license.isLicensed).toBe(original);
	});

	it('enables and disables the mock in development', () => {
		vi.stubEnv('NODE_ENV', 'development');
		const original = license.isLicensed;
		enableEnterpriseMock(license);
		expect(license.getConsumerId()).toBe('enterprise-mock-consumer');
		expect(license.getManagementJwt()).toBe('mock-jwt-token');
		disableEnterpriseMock(license);
		expect(license.isLicensed).toBe(original);
	});
});
