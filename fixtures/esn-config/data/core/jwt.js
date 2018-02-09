'use strict';

var fs = require('fs');

var DEFAULT_JWT_PUBLIC = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtlChO/nlVP27MpdkG0Bh\n16XrMRf6M4NeyGa7j5+1UKm42IKUf3lM28oe82MqIIRyvskPc11NuzSor8HmvH8H\nlhDs5DyJtx2qp35AT0zCqfwlaDnlDc/QDlZv1CoRZGpQk1Inyh6SbZwYpxxwh0fi\n+d/4RpE3LBVo8wgOaXPylOlHxsDizfkL8QwXItyakBfMO6jWQRrj7/9WDhGf4Hi+\nGQur1tPGZDl9mvCoRHjFrD5M/yypIPlfMGWFVEvV5jClNMLAQ9bYFuOc7H1fEWw6\nU1LZUUbJW9/CH45YXz82CYqkrfbnQxqRb2iVbVjs/sHopHd1NTiCfUtwvcYJiBVj\nkwIDAQAB\n-----END PUBLIC KEY-----';
var DEFAULT_JWT_PRIVATE = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtlChO/nlVP27MpdkG0Bh16XrMRf6M4NeyGa7j5+1UKm42IKU\nf3lM28oe82MqIIRyvskPc11NuzSor8HmvH8HlhDs5DyJtx2qp35AT0zCqfwlaDnl\nDc/QDlZv1CoRZGpQk1Inyh6SbZwYpxxwh0fi+d/4RpE3LBVo8wgOaXPylOlHxsDi\nzfkL8QwXItyakBfMO6jWQRrj7/9WDhGf4Hi+GQur1tPGZDl9mvCoRHjFrD5M/yyp\nIPlfMGWFVEvV5jClNMLAQ9bYFuOc7H1fEWw6U1LZUUbJW9/CH45YXz82CYqkrfbn\nQxqRb2iVbVjs/sHopHd1NTiCfUtwvcYJiBVjkwIDAQABAoIBAAkhTJHGV/fDpSZJ\ncpfyx3OXOYoB22PNBmgezPHKW7goZ7tf/rPLjU/MdXRW2Ps75ssrInzyhTwEzRXQ\nLg/uhKC9RD/B0Fu9PpiYt/vAqlb865qmm5PvfknZhkwntytCL7rQ+HEkysx2br2f\nrPr5XKKK1tIh35NzlwfktWQOjG1sk5vfHc/fyUrWE6KoZgIrW0Rmc8c7YRMwljYT\nUGQAL2LBDGsocFV92AsMCLcCmI/gF0J2g5880htcj+TzsdCHAPviB8Z262mFlmLB\nrPWlUwWLmqdyr9YoLXszZ+iERCglPK8kn14wxcrNWrxLlHU9b2HXRIR9MwlyjLDK\nLc8lgHECgYEA6C3nJfGqmj2Y7fLxZOcTwuP5UvprwbvHaoeU8brPjrt+Wp4MgznG\nIJLtd7twJQhMh4NPQSqZhQxDb+Pa8S5prLH2lvEa9+sNXeh/z5FD0NG1zsNGJ+Am\nB+7xM5LlpinDh+NlCLHiWOg/YcQtqfIvNFwDdt9LGE37dxOpSF9jxIcCgYEAyQUP\nRXECEWYfMd2z7spzJ3hP3o/qPA5WE0EaXMRtLAQg9cnLM7odcT37uFT7joHijPe/\nml7cjJf9oyCZjN8GqGmaHH4MYe5LQVQrwmkMH6Y5pvFta5i9p9SA0h98TEr/rThL\nKRKwz+ItSz6YP7WINBsBdbJNjJxj7su9s8udN5UCgYAdARb+I3l3eThwiUfkngVW\n9FnCJuxtMEMSKMvPgtHI990p/tJ7Vi1NBm3J5k11IttEln/BGUxCVaza/nDsbirf\nWv/+DTKcQ+3QjGnjCTeaj4gRw00xUAwQM6ZIFhLANjlp8Vs+wdIP3zuDwBkgQNPq\ny4/XOr/L0noWfwtHsjrpYwKBgQC8RnblLVEohqOVCvdqIkf0oeT8qYJTuYG5CvLs\nDDXMUhmk29nsmtbUp59KKJ5r/Q75xVm59jtPm1O+I9xtar5LoozrPsvONWhaycEq\nl0T5p7C7wcggTLDlrkzxgPfkZSJPVThgQddE/aw6m2fx0868LscRO20S069ti3ok\nGgMoeQKBgQCnKB+IPX+tnUqkGeaLuZbIHBIAMxgkbv6s6R/Ue7wbGt/tcRXhrc4x\nQDSXlF8GxlJW0Lnmorz/ZRm6ajf1EpajEBh97cj4bnwWFiKe+Vsivkp72wPb9qSl\ninNz0WXJtOTrDLhu55P0mDjArCCYNi69WTq9jTo18v4DI0zzfUUaaQ==\n-----END RSA PRIVATE KEY-----';

function readFile(path) {
  try {
    return fs.existsSync(path) && fs.readFileSync(path, 'ascii');
  } catch (err) {
    console.log('WARN: Cannot read JWT file: ' + path, err);
  }
}

module.exports = function() {

  var publicKey = readFile(process.env.CONFIG_DIR + '/jwt/public') || DEFAULT_JWT_PUBLIC;
  var privateKey = readFile(process.env.CONFIG_DIR + '/jwt/private') || DEFAULT_JWT_PRIVATE;

  return {
    algorithm: 'RS256',
    publicKey: publicKey,
    privateKey: privateKey
  };
};
