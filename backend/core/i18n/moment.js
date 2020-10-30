
const momentI18n =
{
  /**
   * This mapping is to support Moment's datetime formatting with locales.
   * Note that 'en' is loaded in Moment by default so we don't need it here.
   */
  momentLocales: {
    fr: 'fr',
    vi: 'vi',
    zh: 'zh-cn',
    ru: 'ru'
  },
  customMomentFormat: {
    fullDateTime12Hours: '[FDT12]',
    fullDateTime24Hours: '[FDT24]',
    fullDate: '[FD]'
  }
};

/**
 * Each time we add a new language, we need to make sure that the 'longDateFormat'
 * has the custom formats. You can see the example long date formats of a language
 * in the 'locale' folder of moment (moment/locale).
 */
momentI18n.momentLocalesOverrideConfig = {
  en: {
    longDateFormat: {
      [momentI18n.customMomentFormat.fullDateTime12Hours]: 'dddd D MMMM YYYY hh:mm A',
      [momentI18n.customMomentFormat.fullDateTime24Hours]: 'dddd D MMMM YYYY HH:mm',
      [momentI18n.customMomentFormat.fullDate]: 'dddd D MMMM YYYY'
    }
  },
  fr: {
    longDateFormat: {
      [momentI18n.customMomentFormat.fullDateTime12Hours]: 'dddd D MMMM YYYY hh:mm A',
      [momentI18n.customMomentFormat.fullDateTime24Hours]: 'dddd D MMMM YYYY HH:mm',
      [momentI18n.customMomentFormat.fullDate]: 'dddd D MMMM YYYY'
    }
  },
  vi: {
    weekdays: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
    longDateFormat: {
      [momentI18n.customMomentFormat.fullDateTime12Hours]: 'dddd, D MMMM [năm] YYYY hh:mm A',
      [momentI18n.customMomentFormat.fullDateTime24Hours]: 'dddd, D MMMM [năm] YYYY HH:mm',
      [momentI18n.customMomentFormat.fullDate]: 'dddd, D MMMM [năm] YYYY'
    }
  },
  'zh-cn': {
    longDateFormat: {
      [momentI18n.customMomentFormat.fullDateTime12Hours]: 'YYYY年M月D日ddddAhh点mm分',
      [momentI18n.customMomentFormat.fullDateTime24Hours]: 'YYYY年M月D日ddddHH点mm分',
      [momentI18n.customMomentFormat.fullDate]: 'YYYY年M月D日dddd'
    }
  },
  ru: {
    longDateFormat: {
      [momentI18n.customMomentFormat.fullDateTime12Hours]: 'dddd, D MMMM YYYY г., hh:mm A',
      [momentI18n.customMomentFormat.fullDateTime24Hours]: 'dddd, D MMMM YYYY г., HH:mm',
      [momentI18n.customMomentFormat.fullDate]: 'dddd, D MMMM YYYY г.'
    }
  }
};

module.exports = momentI18n;
