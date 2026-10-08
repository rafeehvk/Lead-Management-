import {
  InvoiceThemesSettings,
  DocumentThemeConfig,
  ThemedDocumentCategory,
  DEFAULT_INVOICE_THEMES,
  DEFAULT_ITEM_TABLE_CONTENT,
} from '../../types/invoiceTheme';

const INVOICE_THEMES_STORAGE_KEY = 'mysar_erp_invoice_themes_v1';

class InvoiceThemeStorageService {
  private mergeTheme(def: DocumentThemeConfig, custom?: Partial<DocumentThemeConfig>): DocumentThemeConfig {
    return {
      ...def,
      ...(custom || {}),
      showItemTable: custom?.showItemTable !== undefined ? custom.showItemTable : def.showItemTable ?? true,
      itemTableContent: {
        ...DEFAULT_ITEM_TABLE_CONTENT,
        ...(def.itemTableContent || {}),
        ...(custom?.itemTableContent || {}),
      },
    };
  }

  private getStorage(): InvoiceThemesSettings {
    try {
      const data = localStorage.getItem(INVOICE_THEMES_STORAGE_KEY);
      if (!data) return DEFAULT_INVOICE_THEMES;
      const parsed = JSON.parse(data);
      return {
        salesTheme: this.mergeTheme(DEFAULT_INVOICE_THEMES.salesTheme, parsed.salesTheme),
        purchaseTheme: this.mergeTheme(DEFAULT_INVOICE_THEMES.purchaseTheme, parsed.purchaseTheme),
        receiptTheme: this.mergeTheme(DEFAULT_INVOICE_THEMES.receiptTheme, parsed.receiptTheme),
        paymentTheme: this.mergeTheme(DEFAULT_INVOICE_THEMES.paymentTheme, parsed.paymentTheme),
      };
    } catch (e) {
      console.error('Failed to load invoice themes settings', e);
      return DEFAULT_INVOICE_THEMES;
    }
  }

  public getSettings(): InvoiceThemesSettings {
    return this.getStorage();
  }

  public getThemeForDocument(category: ThemedDocumentCategory): DocumentThemeConfig {
    const settings = this.getStorage();
    switch (category) {
      case 'sales':
        return settings.salesTheme;
      case 'purchase':
        return settings.purchaseTheme;
      case 'receipt':
        return settings.receiptTheme;
      case 'payment':
        return settings.paymentTheme;
      default:
        return settings.salesTheme;
    }
  }

  public saveSettings(newSettings: InvoiceThemesSettings): InvoiceThemesSettings {
    try {
      localStorage.setItem(INVOICE_THEMES_STORAGE_KEY, JSON.stringify(newSettings));
      window.dispatchEvent(new CustomEvent('erp_invoice_themes_changed', { detail: newSettings }));
    } catch (e) {
      console.error('Failed to save invoice themes settings', e);
    }
    return newSettings;
  }

  public saveThemeForCategory(
    category: ThemedDocumentCategory,
    themeConfig: DocumentThemeConfig
  ): InvoiceThemesSettings {
    const current = this.getStorage();
    const updated: InvoiceThemesSettings = {
      ...current,
      [category === 'sales'
        ? 'salesTheme'
        : category === 'purchase'
        ? 'purchaseTheme'
        : category === 'receipt'
        ? 'receiptTheme'
        : 'paymentTheme']: themeConfig,
    };
    return this.saveSettings(updated);
  }

  public applyThemeToAllCategories(themeConfig: DocumentThemeConfig): InvoiceThemesSettings {
    const updated: InvoiceThemesSettings = {
      salesTheme: {
        ...themeConfig,
        headerTitle: DEFAULT_INVOICE_THEMES.salesTheme.headerTitle,
        termsAndConditions: DEFAULT_INVOICE_THEMES.salesTheme.termsAndConditions,
        signatoryText: DEFAULT_INVOICE_THEMES.salesTheme.signatoryText,
      },
      purchaseTheme: {
        ...themeConfig,
        headerTitle: DEFAULT_INVOICE_THEMES.purchaseTheme.headerTitle,
        termsAndConditions: DEFAULT_INVOICE_THEMES.purchaseTheme.termsAndConditions,
        signatoryText: DEFAULT_INVOICE_THEMES.purchaseTheme.signatoryText,
      },
      receiptTheme: {
        ...themeConfig,
        headerTitle: DEFAULT_INVOICE_THEMES.receiptTheme.headerTitle,
        termsAndConditions: DEFAULT_INVOICE_THEMES.receiptTheme.termsAndConditions,
        signatoryText: DEFAULT_INVOICE_THEMES.receiptTheme.signatoryText,
      },
      paymentTheme: {
        ...themeConfig,
        headerTitle: DEFAULT_INVOICE_THEMES.paymentTheme.headerTitle,
        termsAndConditions: DEFAULT_INVOICE_THEMES.paymentTheme.termsAndConditions,
        signatoryText: DEFAULT_INVOICE_THEMES.paymentTheme.signatoryText,
      },
    };
    return this.saveSettings(updated);
  }

  public resetToDefaults(): InvoiceThemesSettings {
    return this.saveSettings(DEFAULT_INVOICE_THEMES);
  }
}

export const invoiceThemeStorage = new InvoiceThemeStorageService();
