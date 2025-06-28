/**
 * 企业版许可证模拟器 - 仅用于开发和测试环境
 *
 * 此文件提供了一个简单的方法来模拟企业版许可证，
 * 使所有企业功能在开发和测试环境中可用。
 *
 * 警告：请勿在生产环境中使用此代码！
 */

import type { BooleanLicenseFeature, NumericLicenseFeature } from '@n8n/constants';
import { LICENSE_FEATURES, LICENSE_QUOTAS, UNLIMITED_LICENSE_QUOTA } from '@n8n/constants';
import type { License } from '@/license';

export class EnterpriseLicenseMocker {
	private static instance: EnterpriseLicenseMocker;
	private originalMethods: Map<string, any> = new Map();

	static getInstance(): EnterpriseLicenseMocker {
		if (!EnterpriseLicenseMocker.instance) {
			EnterpriseLicenseMocker.instance = new EnterpriseLicenseMocker();
		}
		return EnterpriseLicenseMocker.instance;
	}

	/**
	 * 启用所有企业版功能
	 */
	enableAllEnterpriseFeatures(license: License): void {
		// 保存原始方法以便恢复
		this.originalMethods.set('isLicensed', license.isLicensed.bind(license));
		this.originalMethods.set('getValue', license.getValue.bind(license));

		// 模拟许可证检查 - 所有功能都返回true，除了SHOW_NON_PROD_BANNER
		license.isLicensed = (feature: BooleanLicenseFeature): boolean => {
			// 特殊处理：SHOW_NON_PROD_BANNER应该返回false以隐藏横幅
			if (feature === 'feat:showNonProdBanner') {
				console.log(`[ENTERPRISE MOCK] Feature ${feature} disabled (hiding non-prod banner)`);
				return false;
			}
			console.log(`[ENTERPRISE MOCK] Feature ${feature} enabled`);
			return true;
		};

		// 模拟配额值 - 返回无限制或很大的数值
		license.getValue = (feature: string): any => {
			if (feature === 'planName') {
				return 'Enterprise (Mocked)';
			}

			// 对于配额类型，返回无限制
			if (Object.values(LICENSE_QUOTAS).includes(feature as any)) {
				console.log(`[ENTERPRISE MOCK] Quota ${feature} set to unlimited`);
				return UNLIMITED_LICENSE_QUOTA;
			}

			// 对于布尔功能，返回true
			if (Object.values(LICENSE_FEATURES).includes(feature as any)) {
				console.log(`[ENTERPRISE MOCK] Feature ${feature} enabled`);
				return true;
			}

			return this.originalMethods.get('getValue')?.(feature);
		};

		// 模拟其他企业版相关方法
		license.isAdvancedPermissionsLicensed = () => true;
		license.isSharingEnabled = () => true;
		license.isLdapEnabled = () => true;
		license.isSamlEnabled = () => true;
		license.isSourceControlLicensed = () => true;
		license.isVariablesEnabled = () => true;
		license.isExternalSecretsEnabled = () => true;
		license.isWorkflowHistoryLicensed = () => true;
		license.isLogStreamingEnabled = () => true;
		license.isMultiMainLicensed = () => true;
		license.isBinaryDataS3Licensed = () => true;
		license.isDebugInEditorLicensed = () => true;
		license.isWorkerViewLicensed = () => true;
		license.isAiAssistantEnabled = () => false;
		license.isAiCreditsEnabled = () => true;
		license.isFoldersEnabled = () => true;
		license.isProjectRoleAdminLicensed = () => true;
		license.isProjectRoleEditorLicensed = () => true;
		license.isProjectRoleViewerLicensed = () => true;
		license.isCustomNpmRegistryEnabled = () => true;

		// 模拟配额方法
		license.getUsersLimit = () => UNLIMITED_LICENSE_QUOTA;
		license.getTriggerLimit = () => UNLIMITED_LICENSE_QUOTA;
		license.getVariablesLimit = () => UNLIMITED_LICENSE_QUOTA;
		license.getAiCredits = () => 999999;
		license.getWorkflowHistoryPruneLimit = () => UNLIMITED_LICENSE_QUOTA;
		license.getTeamProjectLimit = () => UNLIMITED_LICENSE_QUOTA;
		license.isWithinUsersLimit = () => true;

		// 模拟许可证信息
		license.getPlanName = () => 'Enterprise (Mocked)';
		license.getConsumerId = () => 'enterprise-mock-consumer';
		license.getManagementJwt = () => 'mock-jwt-token';

		console.log('[ENTERPRISE MOCK] All enterprise features enabled for testing');
	}

	/**
	 * 恢复原始许可证方法
	 */
	restore(license: License): void {
		if (this.originalMethods.has('isLicensed')) {
			license.isLicensed = this.originalMethods.get('isLicensed');
		}
		if (this.originalMethods.has('getValue')) {
			license.getValue = this.originalMethods.get('getValue');
		}
		this.originalMethods.clear();
		console.log('[ENTERPRISE MOCK] Original license methods restored');
	}

	/**
	 * 检查当前是否为开发/测试环境
	 */
	static isDevelopmentEnvironment(): boolean {
		return process.env.N8N_ENTERPRISE_MOCK === 'true'
	}
}

/**
 * 全局函数：启用企业版模拟
 * 在应用启动时调用此函数来启用所有企业功能
 */
export function enableEnterpriseMock(license: License): void {
	if (!EnterpriseLicenseMocker.isDevelopmentEnvironment()) {
		console.warn('[ENTERPRISE MOCK] Not in development environment, enterprise mock not enabled');
		return;
	}

	EnterpriseLicenseMocker.getInstance().enableAllEnterpriseFeatures(license);
}

/**
 * 全局函数：禁用企业版模拟
 */
export function disableEnterpriseMock(license: License): void {
	EnterpriseLicenseMocker.getInstance().restore(license);
}
