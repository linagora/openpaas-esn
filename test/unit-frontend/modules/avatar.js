'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Avatar Angular module', function() {

  var picture130x130 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIIAAACCCAIAAAAFYYeqAAAACXBIWXMAAAGKAAABigEzlzBYAAAAB3RJTUUH3wYeDhoh5uAW2QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAB/pSURBVHjazZ3beqLcEkVRliBq8v4P8L/gToLikX0x4uhqNLYHMHLRXzqdjkCtOs2aVTX677//xuNxSqmqqtlstlgsFovFfD6fz+fT6XQ8Hu92u91uV9d1XdcfHx+fn59fX1/r9Xq/32dZllIqy3I6nb69vb2/v8/n89lsNpvNiqLI8zzP86zXa7/fb7fbpmlWq9Vyufzf//738fFR13XTNJvNpm3bPM/Lsqyqaj6fv7+/c0tVVU0mk8lkMh6Pr/mUw+Gw2+02m81ms+GD6rr++vri6/V63bbtfr8fj8dlWU4mk6qqeHs8flVVRVGklCaTyZVvII1Go8PhcDgcttvtcrkcjUaj0SjP89FolGVZnueHw6FpmqZplsvlarVqmma/3+/3e565KIqiKHjs6fFKKaWUrnzmm648z9u2nUwm3PB8Pt/tdofjxdebzWY8Hud5zm3kec6d+MU/ZbDf73e7HS+kaZqvry9lwPd5RXwEMnh7e+MNVFU1nU7z43Xlc6XJZLLdbrfbLX9HEt5QSol7QgabzWa73W42G6SFwDl9s9lsOp2WZclBGEIGXOPxeDKZtG1bVdV+v6+qipOLDHgQJJGOF1/vdjte32UZqAo8LzKo6xrl2O12CpVTX1UV9gMB+Pg3WYJUliUqtt/v1+t1lmVFUaxWq/F4vF6vOXfcE8dhu90eDgcerCiKsiyxY3yN7vduizpiSCkdDoeiKGaz2X6/32w20+kUezUej3mP3LzC4K44PT8dkbZtEaTP+/n5qcXDDGRZNhqNeNdRDziL2IbxeHzrKUxlWR4Oh/V6vdvteJK6rvEHvFaec71e+zNt23KsOAtlWXITnIXh9MALRcR6lGU5m82wFZyk7XbLwV+v16PRqCzLpmlUUIVx1vHwe/Q9dV0jD3xh27bo4mQywQcsFgu+wBLwKXe8gT/awHHY7XbRE/Ib0QDdMka2PF7cBzeRUjr7hL2LAa0vioITwxFGMNwkN5zn+XK51FXwJ5HFWRlw2larFfFIXdfIlX9FpWIIgCmezWaagfsePy0WC8Sw3W6JAfgCqeLA0Vaev23b4nhxBxrEQV3CWdPUtu10OlUSiKFt2/V6zddN0+AqNdkIoOMkoh40TUNc1DTNer1umma32xEX4Ag5ecaEusNT0d4ghvl8bqSRUuJM4ej2+/3hcODo4Q/8PIJU9YDvD+oSfoqa9vv9dDpVDxAJhpRv4q4nk4kxtKEgh4b/yOFbLpfL5fLr64svtEUo0GQy4amNi/pyh2k2m3HeuaGU0nK5JCIyBESXue+iKDgUHRk8xxydjZqMMglmPFUcI0zTarXiDrGoCADl1i3z4LoEAkj9QUqJ429cRHrUS0iSqqpq2xav0DQNH6yVND7jIKCeaEP0S880Rx0x8ArQA9II7GrbtpvNZr/fj0ajpmmMkTxPHhqsPxG5ySkyQE4cPk7e29vbYrHAGCCbXmzAHxdNlNY0TZZliAQxoA2YLB8GTdQz/4oMNE2eku12u1gsEAkPxZ+j0QjTtFqt0AZeHw6Ph8Ut13W93W7JGLAQOsJOfoA5esQfnBHDZrPhl6K2uizsLHrHN3kMsQH+6RfFoE4gicPhQPyKxTe+IOjAY3u3OHnCcV3Cer1GBoTsMT9AAIYkPfrC73Sf14oYiFmxVPrq9nihFjw59/G7MohhT1mW+3BhmpqmQRikEdwwESDZOMcf3MJwkYCQ/EBHSHRkjtajL/yO3rQ2PA82EdTIUIE/dWuKKnuBi9suioI3jgz0c6I1+LzRaIRmj8dj4yuy5aZp+O+cS974bDZ7f38HL8IW3ZejXRKDSJYBBnImHOTsxPyTuwThIDp8fqh62TQRwuoheChODPkE+g0yRnIKaKb2o+jmB/P5HItHyHsBDrlfDLxT3UCMz3B63BZxoTkEP2ze5Hn8ddOEnTFg5SZ5Rm4VYWBVkBlHEF1Rt0wRxK4HRY6TiSIRqjkErpun+vYhKeV5jvXErU0mE1OhIc7I3QqhGMAhzCEOh8NqtSJI9VTpDtF7oiCuxWKBAKqqIn0b6BkTrxX0Ci0WPcWG8op14NglQgt9tT/z/AzurJPY7/dFUagKFkiQCpkpFyih56wsyzzPTZWtH/D4w52zRK5A3oiRwdcB3sXH04ELOln9MDXtK45+UBJFURBB+PbBi3BpXMiGp4h4jJlatEVDo/dps9kgA8I18fTpdEqkZD3EYImH4QR9fX0pBit3r+CuOdq4vaqq1us1x5kcYrVaYaZI/UBx/I9VVRkaIZWh7W2KpU0ctdUSEzS0xCTIMAMknPeuMF7BXXtXu92O8F/oiRAWX2jAzUOJ32GQTdN+qk/0KQZKS6Ytlja5Ce0SqAsYGckEWY/lLbVB1/frpgkYRrOO6+4AsXmeg3NYXSdzJmN4GkaQVqvV19cXwCSqAIBKoIYY2rY1wMAi8cOgNNoiEwtyjt9111pR8wYcMjdmKkqeZEpsWnC2LDGsb7AWLZsBFPft7Y3vCCtx31pVPUQHMttutw+WQR6XAZbTFBoN4F0bgm+3W/EYDpOwjRkfchpcDIDsfBhxgviJeSPIDNJCl5EBdhZFQf0NqH7RXfPurKYZGuHexNC2221EJ/EB5t78MFDmEzQ7mUYK8IlkESoIh0XYg/vjr5ys9Xpd13UMXn8lp5NzRWYjvYp8DTsznU4JkEQqhYlE+qCnYL7gHQ0rhg6KQuZiiZUEwtpczH1g0KAc3HGkBnHEngz8eVCABighUMZBIcgxqVyhzZYUAb1x3U3TkMdxmIBABrWxiRQmygBbRNzGO8UZgJfpSFAICywGTnIgVIXnmCb9gaU0Sgh8wSNYKaEsIUYQLzNTrStP0Tuq+pcYxCFAcSlxRNaNAQPwwH6/p8JlUYXDAlWLugo6LhvlCaZJth2nYb1eQ7WD4YJjsKiFQhgvcZJAcXgK1Lqu62ha+Q1DYUqoJK8ec6QMRLLMhsqyxDeoFioHgSwSXa1W0e8NrQ3RFsk6BRoAgiSiA7bjrng0DA5UScpw/CpYBMjDoINXMRTCan3D6MgqawwPeJXEspFsiySscI3HYx11Skma0HCmSSWQfR0ZLtgo4guSMtjdkNXRBkAEqU0EHVSHoo3Fbg8UOCXMkaGRqnBKQNPlqhCIAUDG+DXPc01TBOiHME2RFwPLsa7rz8/PyL7mx0AEZMBXVYUYLLTxdARUCGOz2Rj4ccJQoCFgvoQScOGlIxn9Qq1xt9stFotONhd57da3ZWj1KwYjN9DJ9XoN8xdQAH+AAxCbgV0B8RmUCS4Ept+iEEfN1CcCNj5Cv5JI9kegCpeJ+fpzrQG8di4CJ9goWCSLRTGf6NcfoAfKAH8AUinTEDHArpB1KtOHOEKKtAQnLhhDugccjKFUb2KAe9MxR/+sq7RtC4zMTYsWgJEBvuoMY7tHL6UhXtBpNw7JGmeiw7aTV6H/08qTPFueE4i1SCegadWLR+jRXSfqfHIOrgF1UVIqXICAYpayLjlHiCGapsdLQ1EPYjcOFCNZp0DFvHEYj29vb1hd2RWiSbF8DZyMTvN1NAYWu4xle3HXibv0zq75pb5N087IKJCi4psixtDjPRLCGhrIMfz4+LATCQTJ5EB6S+yI4kkNQKy3w+VVG5bLpRReYi2xhug7Izr7kBhms1ksGNxU3oq8dhF8qkOgypgmwnmf4e5bP9sZiAxwD7J7kIGdIOJj1h78dLmXpkERGFdFiF9j4MRZFFR+VAwcmTvCmA6vXZ2wawhdIYGq61rTFBl/9+kB1K6znYHyGZCBeoDGnw0CO95Oo0cCwUmy2SDy6kQDHw+ckhjWfbXGyGsX2bfW6GPQdWO/za2RxvWdgSSYkfkrLnCBbceRAnn148QIYpnLtE61Jrx8MHBKj4TzHV57VVViA0Sup40ekf96fZeyWEXsDNQfIO/TzkAEIFJ5OVxGEhAJjFYjR9SUgsApFn3RiUeCwEdDrg6vPT6Al40e5qs6yX/qcrRFy+MVOwOVwWlnYMTH/pmyCF8aOEV2U+dPmzB5CqGzu01TDxi6kQnuuixL2jQkBcnhwGpPJhO7ZS/7autoxkV0BhKbRijFzpdHOgNVbsVgKdQAwW6J2KHeYaj8jhi8A9hNeAjeHS+aW6ecUtc1b80ux5/SCNuhIm5KjqYtwoxwAnrpDBTBxLvoJ4yjxDyoTESFkAx/T0NuX2wUxEBSPZvNkAQniIfhyDRN4wmNcNMFc2SXMjKQVcW7wOX02BmIk1AhTE4lqSCYzqiEGHf8mhg0TXjI3W6nWuCiUQhqMhgQY8ezpsmcvDlexqYI2DiN2JQ8GcfweGeggVMHUY6ED8ASrKVBh07o5ikBfYlBaF4OaMzpsmPLO/QsTRMVPfm8QkYS66wnk6Y5sUNq1xCdgSooWHKsbsUWG8ysVI+Iwt4aNfVZ5pZig0KUZcnJpS5khc5+8aIorHPBkhK2i22BtijjlvkszA6qMERnIMcZSnJM6Ixi+StmllixM5bjpnvoUwz2CGF2aI/l/IoWUO+FORExcP57FuZEcPxVBUBDu9LETTv5QY+tR1ZNyK4tc2XHxn1hAghzpzjmDYN8+q0iqRDcIr7aTnfr7xZSLHrDegLRxCVQQkAYlos5oRgfC1b4g5vQyVuzog7EhEI420L34Dm4FTrrn3vjoB2H64hwrFYrID+tqiYV94BF4tWrBNEW6Q+QAZ0gUQa911llcnTaTIXOUA6I+0BnwuDXm6b+xRDHu2y32+l0arOibDPIJnhgTTnCw2TRrU+qbGiEM0AGTjEiR7t7gs71ksj+pkJF/QApcDSK1/WmKQ103xhxsaaIv4rPGHRTPQU5h+xFvkbni+NT8Ae24kRm26D098gPimgN94auO74JSyu55koGaRr01jm80b+Rc0nXBX/lCeVGkKDhHpzgRI5mGQf8zlacoeloHeiMnM5MgmchMSK4ECCw/nHZSQwrBgFL2p5QCAoD2XEiXl3X1lVAknHRhiWxQVh/MFyn+D8DJ3yerdfcfBwJwbzCoiicDfFPJ5EGvW8TNKdExtYBZ7IR8+kbBNGcISSZyjz5kYlqD+Z0kbqonwApyEJb1OfnZ1SIy04iDXrf2koOjhMKZfxx61kg6kIZQgDcOqHRfD6PaZo5R/bES9MEddFwHDHYFSiX16FBsZvo2WKItZSiKObzeWTTOMYsUh+soHHTCAATZEn51kmzA4XjjPnDSaC+ZA+ifrG69c+uwPScE2RTH6aJeoP1S2dFaoLKssS8ng7RURWy37iM2Qg9ADGxSAjArMKeDyXhOTuVRHrOfRN3Uxeyy9XpCWgGQRR48uR4xU5xqRW/2/AbJyOrClbLjT70E6Zy/BMRdidwSk9TZEdWVlWFE8uOk1yAKxy/QSUSDvZ0Ol0sFh2KUfbbl6wU3DU+T1eHmUUGUmmszZ0NnNIz7xvTlB3HoJr7iHZgkXgYp22aMfz6GLPTuq+pdazA28EIsG8GR/9ydqQKxvP0vJ5ZPZVzZyI4Q4AhfdEGKSwYwngdMaji2XEyBxbJakR2nCEcmchxfBi2QUmkZ54gLvOG2KXcgWiQAZKTU/M6MojRhyCm7sGsIjsOR+4IwIGWf0KYp920QHccCBnJubxxXrpN/b76F5kmd9Y6OVwu8swcFkaY7v3HKbCK80likArvWDLxpWglOwlnZKk4dOelxBBZKR2Clmw5Z8dJRonkgW/y+dNkAIINdCFJgAAUSFxImUgpO47oIM94nXlNp6ZJhpnEKjUeJxGn8sbVDvTKj8fjwZ+qQ32ktkxYnR0Zj8RFHC4nUtn47uDjB0n5T3DX0cnFNxBFEoe9iIc/QwwA2gDXFtQ4IMqAv8pTR1uhAbh9IY6BeEGd8I073NJgBEaEpdzoHr7DECkRA5kjqS5wjShwOmDN0ShER3bpZEd2UGygM/1+QdOUhSIdZ//9/V2DbJnLKhaarQ1Iww2EsOkBGcQx8FBL4tgieEd8X6V2RY/M1w6b5gWtkxQhlUMKrFkqpslIPc/zvyZ49Kjs9mPZmUNZCqNkbZlUDp1QdXQMsGmapuEHVIvsNQaY/eQkiJE6ydBoNPr6+pIGGMWW53laLpdM6znbkv6IKsSucQRgw6icO1AmCpmUc52tYIMNLSo26XOfr5lGZH/zzCLFj1n4kBZj28d3VQaUgx/tKw6RNkk5U9qdA/lJku1+nM1mPIBNDFmWobayxyKbJober2yapCTPZjO+4KE4Q842y7Is1XUd09THmYd2JBAdGaTaEuKenDioA5cQwbI41I8+Rtk0jvR4TTFkgeJuH3W81fiA5BPp8/NTbMci0d3WSftOeArri14EnRAysIZDuzLr8aitx0IQh0hfLdiHSX1ZX52FzsbpdMrLFH/l1fO6iGUTFkBN4ajexzoxW46TXOJ8Fse4IAbKy5Q50WLHiQiQ6dD01bBF44TUV9YJfVj79xV7yHe7XYLQyM/FKU5XTgzo5IqaI9b4yYa3yk9wTUHNlhBJSvyG6XTqdFhOA+7aORy28XQqvS94xXlIsWsovrHD4ZBIK/QQjovowIH/lAGIblzjKAvY/ZUuRYiDOqwtA8G7LEn+toA+KYjBktbpNfPqThSLdRLkwD0wrmOz2aQ4o1TT5AA0J1dfThHiMBfSNPIDDjUW3MWJjjFzQ5OGngoPFomFdM7RtzoE+RUDNdxei97BcDXgcDhI+uORd7tdUjVwEhGfyo4DoS5LojPscblcfnx8ECaJq0Sahd1R1pat01ooZfutO1ctocAww1ETAry+r46SgM+RhdIpb/47NjWM6fgJawA/SUI9cI0jemDTcmxlUBLYotMuQflYVNth05h1k825uhfdwme8LOR3mmDznpmjz4CU0WiUiqIga7VCJLEpblA6a50MjdADm/e1RS5GkYHqQP6z68wj0Q/HTo7t7GoCJ7w301LN6X59KviVCTaHzBr7dxGUZA96L/G+bkTlOGud4gBmEQu0QS6evXnOMEMh9K6nLy4OEom0OMvu2XFhHiMu8dUWrl9cEt6er5Hjnhh3hso7TvU0io0VSsQTV8qSpjHwzh4YznWccBfN0YUSv6gqCsEsJmIkOzKJmtAVsb9bd5Y/+YorhiKv6XA4fA/05OVaMuU7RrHZ3xV5N/PFhlmgKwnxMgzjLt04TefC+7L+Q2eyaHlsiVUMyCBOiXxNhXB4uDvQXVbVtm1aLBZZ2GRgW52Den31fI0JJozpzJ6Nzfs2SNOR4ECdK5s1rQVtNhvoYuC10HhjJQN+NV9AaHxBhXBsrYOIyKv+gAvz+VzfiC2KywONYu2WtQ/SZk33Aunk8ZkOGpQNfxMD1XSPvHq9XuO39fyyC5bLJfGrmf9LpRHRihJAcmqJJMFZE4NhVRw8hi1EMYo1w4jagEKQNLi/kthUVbBB6qaG2Uhh32w2GLfYi0lM4fhnKOIv5R5MbHWiVoJxqH9Yo7pohFHXtRu63GjF+eLVEy8R4JoiSHiRQK8eyEC9ozlHqih64Os2mmACMiGTUxVvnRs4nDMw8+dduQtZ+0Hgl+d5khQkmkT3lh0smJrtdqsnNFICwRYL4SSC1hEa6Q9uGifWsUvOkKyqigUXVrPFmjgNMpF/XSfiRFSHojk5HNDBQUTfeYNvJ76myNMnSoHeYmzuZhO8t7ZoMpmAYDve9ZFxfnGap2rBkbe+xKwEzKA/8FsKEWmTmGs8KBADARLJGW/yGy2OOVS8b/0EksB7R8Q8bskwIez4A1GjB8f5QaWhWQg/wV3hrrFUbipFbL/Co3FMs6NX2CShB+U1RlIWRyfZbhbH++ktOO9yvCKplEflhKJSETo1TXt8grJzHIiXjJqoomOdLAqhE6JPzwyZojOIWa1t3o5KQA84oww9SJFMEDuz3FTCuEX8jGMeEVVVVVg3BRs3XPfVIGWLNTW7zWbDiEsq1U4NdvqDFmnQZapnZRDHAoosoAcSW7EfVFmwGfP5PEWvEOtENjVSd4QBSBlHcnXcieaCZVdV9NikZkEQFUYbIlmaW1UhcBiS0oaWgUwU0X6ATowS1pKz4lQ6AkgnZKZ46Dq+gZiH+rBcZdy1O69PB2LGEfX9FnXdxODmKkukLixg6C7+3B2Uw/nquGPOMJQMmSTZ/nW7/0xsgdq+649nwRxW08VR/52V5Dhw+CwGv4L+Nhj1W16nVoW2xY16eghHghO8mqkM5KstQ0UmChiz1Gnu0KCINDYOD/920aeG2DWZp928p+9XWk1sdCFk7HeNo47a+Rm4Bz6oU4Byl4p+ovc0wtqZKEXTNASmMORMfrkBYxanlMadGelsyGVEFLeYRhIyX2h5beaxSGmHcL+SkNhhSg/ohDAcSWMpotNd0yNE0dlfoB6AKUSeFXE8LsF5E3HiQVcMcWtU3DJuIZMakTNgY15mfpdSEhC8hlFwR1JNiRSUyW4U6SfuKYjziPvaUBXHH5oeU+8SJuJyLzu6S/ERPejU4f/q9lHIuHsVzV4E3KPlRteFZEf22WQy4fkv1Ox68dWOgo6rI7KTgd6xb8WJX49nZ3GhkFAdqZXNfZ4YolLffhwTi9P9zts6WKABFuK1LQIo3ywvtlxjpsgtqBT9VLPryy45V8NuCcpYkhDolaM+6qDaB5f2xoVCFNud0KtDlkPv5KXOaEbxnk4kmaKuxeJ+jLf4vRB+s7+3XXNA2PvWgUM6Nbu+Qng3C+EVNBFS/HiQzvK8eBTukER0BmYGpxmydhiDSSLlAvSqqjDsp8XH711bQlEgUE7mjzuWO0vQyJuACZ0S8VPNrl8/YQwa1++Zo2I0BLtY7RmbGG9C/WLNQEPN+8Fg8HGxzdsBE5ITHdX7E9Kc1AMsnewKWaSOshDjxFELcNrV9VPN7nrm2a2cHwgDjJeyq8meS/2zMwc6K06vd8gOzo+ZAYt3NYkIIM9z1xa4zwafeqGRJ2FeJdyRgqN9vFnMHPiEK9VlhxMXSog/W7O7knl2qyRISt3HGIF3viCrsEVlHK5rTFPcAM4Vp4XzfnxYQ4C4vKAz+ObSkDcXy+oSEDXWxsIyIDOJHyAgJ1FA8Kea3ZXMs/tQJodb7vd7kgnDVldt4bo8ibE2d+G9nBbxYYSy6RKp+FCE/zqDCDObRV6WehI3dSi5sUfcGiUVHjFw2AFfL9TstNeaJo5wLwA4YnByiGktaZ3xt6MgT7e2/ZTTRYfMoYzFS4o2hGRCde59pWumI4N/z2F1QwWfhw4alTryscN7xCYg4Z9qdoQrFLetsMaq0eM6IVPa4QhxgIv/hII6SdvNh6dEv9MivsVLnIEAu1i6685pGIjrDK/v6kydJFCumPruZ/BXCRaRY3las3OfI9+Rnuafbvx9EO3psI+dP50dSccaybgIycAvZhJxzWUsIHeK+P5yMmR5QNXxitMlrnyKxIJll72jj8Jnne1ptoS4m/Rszc49RA57oozaAdUvD2O83knEpb1xjk5cZI2p/O4FD7NRdRKxk+VUBiiBPUsWZU3NOlDdrccruaEC3CI7TiR3EnNnGnYn2jmt2WXHNmB0wiqeRkm4ED+RHXdtPqgQWZZBtjRyjVNdkAR7z2KPkICY1RRe+sfHB7EpSYmGOm7dJWwRqMAZ4DhvfZxkt6xjvWxHIDTyM06JRmdrdvaVRh6mCY5yUhi97FaPqTWHSXngqxylE5EYx31ZauRVxOIloGF0yK7ZhQRk65iDku+AbZLtaW63QAmikGOX2enzx0+1jUJXTL3erEpTIH4eNzDfLYk4ZpTPsrFJm2lK4SIVZAAKIpYjRGGHQNz4qpHgjMb2vUdoaikuLcLk8RkOJf9n9iGQGQdFdGYO+CLcpGEK5r/K7HtEErg0O5Bj0RAvRc7vCALWP…';

  beforeEach(angular.mock.module('esn.avatar'));

  describe('imgLoaded directive', function() {
    var html = '<img-loaded width="512"/>';
    beforeEach(inject(['$compile', '$rootScope', 'selectionService', function($c, $r, selectionService) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.selectionService = selectionService;
    }]));

    it('should draw the loaded image in a canvas on crop:loaded event', function(done) {
      var img = {img: 'mock'};
      this.selectionService.image = img;
      var element = this.$compile(html)(this.$rootScope);
      var document = element[0].ownerDocument;
      var create = document.createElement;

      var drawImage = function(image) {
        document.createElement = create;
        expect(image).to.equal(img);
        done();
      };

      document.createElement = function() {
        return {
          getContext: function() {
            return {
              drawImage: drawImage
            };
          }
        };
      };
      this.$rootScope.$broadcast('crop:loaded');
    });
  });

  describe('loadButton directive', function() {
    var html = '<input type="file" load-button/>';
    beforeEach(inject(['$compile', '$rootScope', 'selectionService', function($c, $r, selectionService) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.selectionService = selectionService;
    }]));

    it('should set an error in the scope if file is not set', function(done) {
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      element.trigger('change');
      expect(this.selectionService.getError()).to.equal('Wrong file type, please select a valid image');
      done();
    });
  });

  describe('selectionService service', function() {

    beforeEach(angular.mock.inject(function(selectionService, $rootScope) {
      this.selectionService = selectionService;
      this.$rootScope = $rootScope;
    }));

    it('should fire an event to crop:loaded topic when setting an image', function(done) {
      var image = 'foo.png';

      this.$rootScope.$broadcast = function(topic) {
        expect(topic).to.equal('crop:loaded');
        done();
      };
      this.selectionService.setImage(image);
    });

    it('should broadcast x to crop:selected topic when calling broadcastSelection(x)', function(done) {
      var selection = {x: 0, y: 1};

      this.$rootScope.$broadcast = function(topic, data) {
        expect(topic).to.equal('crop:selected');
        expect(data).to.equal(selection);
        done();
      };
      this.selectionService.broadcastSelection(selection);
    });

    it('should save the input image', function(done) {
      var input = 'foo.png';
      this.selectionService.setImage(input);
      expect(this.selectionService.image).to.equal(input);
      done();
    });

    it('should save the error', function(done) {
      var error = 'fail';
      this.selectionService.setError(error);
      expect(this.selectionService.error).to.equal(error);
      done();
    });

    it('should broadcast the error to crop:error topic when calling setError(err)', function(done) {
      var error = 'fail';

      this.$rootScope.$broadcast = function(topic, data) {
        expect(topic).to.equal('crop:error');
        expect(data).to.equal(error);
        done();
      };
      this.selectionService.setError(error);
    });

    it('should return the stored image when calling getImage', function(done) {
      var input = 'foo.png';
      this.selectionService.image = input;
      var image = this.selectionService.getImage();
      expect(image).to.equal(input);
      done();
    });

    it('should return 130x130 for tested picture', function(done) {
      var originalImage = new Image();
      originalImage.src = picture130x130;
      originalImage.onload = function() {
        expect(originalImage.width).to.equal(130);
        expect(originalImage.height).to.equal(130);
        done();
      };
    });

    it('should return 128x128 image when calling getBlob and no selection', function(done) {
      this.selectionService.broadcastSelection({cords: {w: 0, h: 0}});
      var originalImage = new Image();
      originalImage.src = picture130x130;
      this.selectionService.setImage(originalImage);
      this.selectionService.getBlob('image/png', function(blob) {

        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.src = e.target.result;
          img.onload = function() {
            expect(img.width).to.equal(128);
            expect(img.height).to.equal(128);
            done();
          };
        };
        reader.readAsDataURL(blob);
      });
    });

    it('should return 128x128 image when calling getBlob and selection', function(done) {
      this.selectionService.broadcastSelection({cords: {w: 1, h: 1}});
      var originalImage = new Image();
      originalImage.src = picture130x130;
      this.selectionService.setImage(originalImage);
      this.selectionService.getBlob('image/png', function(blob) {

        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.src = e.target.result;
          img.onload = function() {
            expect(img.width).to.equal(128);
            expect(img.height).to.equal(128);
            done();
          };
        };
        reader.readAsDataURL(blob);
      });
    });
  });

  describe('avatarEdit controller', function() {
    beforeEach(angular.mock.inject(function(selectionService, avatarAPI, $rootScope, $controller) {
      this.selectionService = selectionService;
      this.$rootScope = $rootScope;
      this.avatarAPI = avatarAPI;
      this.scope = $rootScope.$new();

      $controller('avatarEdit', {
        $rootScope: this.$rootScope,
        $scope: this.scope,
        selectionService: this.selectionService,
        avatarAPI: this.avatarAPI
      });
    }));

    it('should call the avatarAPI when calling send function', function(done) {
      this.avatarAPI.uploadAvatar = function() {
        done();
      };
      this.scope.send('foo', 'bar');
      done();
    });

  });

  describe('avatarAPI service', function() {
    beforeEach(angular.mock.inject(function(selectionService, $rootScope, $httpBackend, avatarAPI) {
      this.selectionService = selectionService;
      this.$rootScope = $rootScope;
      this.avatarAPI = avatarAPI;
      this.$httpBackend = $httpBackend;
    }));

    it('should send POST to /api/user/profile/avatar with valid mime, parameters and blob', function() {
      var blob = '123';
      var mime = 'image/png';

      this.$httpBackend.expectPOST('/api/user/profile/avatar?mimetype=image%2Fpng', blob).respond(200);
      this.avatarAPI.uploadAvatar(blob, mime);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.avatarAPI.uploadAvatar('foo', 'bar');
      expect(promise.then).to.be.a.function;
    });
  });
});
