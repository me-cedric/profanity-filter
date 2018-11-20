// import LangEnCs from './filtersdict/cs.json'
// import LangEnDe from './filtersdict/de.json'
// import LangEnEs from './filtersdict/es.json'
// import LangEnFi from './filtersdict/fi.json'
// import LangEnFr from './filtersdict/fr.json'
// import LangEnIt from './filtersdict/it.json'
// import LangEnJp from './filtersdict/jp.json'
// import LangEnKr from './filtersdict/kr.json'
// import LangEnNo from './filtersdict/no.json'

import LangEnBase from './filtersdict/en-base.json'
import LangEnUk from './filtersdict/en-uk.json'
import LangEnUs from './filtersdict/en-us.json'
import LangNl from './filtersdict/nl.json'

/**
 * BanWord service constructor
 * How to use:
 * > import BanWordService from '@/services/BanWordService'
 * > let banWordService = new BanWordService(['en-base', 'en-uk', 'en-us', 'nl'])
 * > banWordService.censorString('your string here', true)
 */
function BanWordService (lang) {
  this.badwords = []
  this.replacer = '*'
  this.dictionnaries = {
    'en-base': LangEnBase,
    'en-uk': LangEnUk,
    'en-us': LangEnUs,
    'nl': LangNl
  }
  this.censorChecks = null
  this.whiteList = []
  this.whiteListPlaceHolder = ' {whiteList[i]} '
  this.setDictionary(lang)
}

var decodeEntities = (function () {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div')

  function decodeHTMLEntities (str) {
    if (str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '')
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '')
      element.innerHTML = str
      str = element.textContent
      element.textContent = ''
    }

    return str
  }

  return decodeHTMLEntities
})()

/**
 *  Sets the dictionar(y|ies) to use
 *  This can accept a string to a language file path,
 *  or an array of strings to multiple paths
 *
 *  @param  string|array
 *  @throws \RuntimeException   if a dictionary file is not found
 */
BanWordService.prototype.setDictionary = function (dictionary) {
  this.badwords = this.readBadWords(dictionary)
}

/**
 *  Add more the dictionar(y|ies) to current bad words list
 *  This can accept a string to a language file path,
 *  or an array of strings to multiple paths
 *
 *  @param string|array
 *  @throws \RuntimeException   if a dictionary file is not found
 */
BanWordService.prototype.addDictionary = function (dictionary) {
  this.badwords = [...new Set([...this.badwords, ...this.readBadWords(dictionary)])] // this.badwords.concat(this.readBadWords(dictionary)) doesn't work
}

/**
 *  Adds more words to current bad words list from an array of words.
 *
 *  @param array
 */
BanWordService.prototype.addFromArray = function (words) {
  let badwords = this.badwords.concat(words)
  let counts = {}

  for (var i = 0; i < badwords.length; i++) {
    let key = badwords[i]
    counts[key] = (counts[key]) ? counts[key] + 1 : 1
  }

  this.badwords = Object.keys(counts)
}

/**
 * Read bad words list from dictionar(y|ies) and return it
 *
 * @param string|array a language identifier or path for a dictionary (or an array of identifiers/paths)
 *
 * @throws RuntimeException if a dictionary file is not found
 *
 * @return array de-duplicated array of bad words
 */
BanWordService.prototype.readBadWords = function (dictionary) {
  let badwords = this.badwords

  if (Array.isArray(dictionary)) {
    dictionary.forEach((dictionaryFile) => {
      badwords = [...new Set([...badwords, ...this.readBadWords(dictionaryFile)])] // this.badwords.concat(this.readBadWords(dictionaryFile)) doesn't work
    })
  }

  // just a single string, not an array
  if (typeof dictionary === 'string' && dictionary in this.dictionnaries) {
    badwords = [...new Set([...badwords, ...this.dictionnaries[dictionary]])] // this.badwords.concat(this.dictionnaries[dictionary]) doesn't work
  }

  let counts = {}

  for (var i = 0; i < badwords.length; i++) {
    let key = badwords[i]
    counts[key] = (counts[key]) ? counts[key] + 1 : 1
  }

  // counting values and then only returning the keys is said
  // to be more efficient than array_values(array_unique())
  return Object.keys(counts)
}

/**
 * List of word to add which will be overridden
 *
 * @param array list
 */
BanWordService.prototype.addWhiteList = function (list) {
  list.forEach((value) => {
    if (typeof value === 'string' && value !== '') {
      this.whiteList.push({word: value})
    }
  })
}

/**
 * Replace white listed words with placeholders and inversely
 *
 * @param string
 * @param bool reverse
 *
 * @return mixed
 */
BanWordService.prototype.replaceWhiteListed = function (string, reverse = false) {
  Object.keys(this.whiteList).forEach((key) => {
    let list = this.whiteList[key]
    if (reverse && this.whiteList[key].placeHolder !== undefined) {
      let placeHolder = this.whiteList[key].placeHolder
      string = placeHolder.replace(list.word, string)
    } else {
      let placeHolder = '[i]'.replace(key, this.whiteListPlaceHolder)
      this.whiteList[key].placeHolder = placeHolder
      string = list.word.replace(placeHolder, string)
    }
  })

  return string
}

/**
 *  Sets the replacement character to use
 *
 * @param string replacer Character to use.
 */
BanWordService.prototype.setReplaceChar = function (replacer) {
  this.replacer = replacer
}

/**
 *  Generates a random string.
 *
 * @param string chars Chars that can be used.
 * @param int len Length of the output string.
 *
 *
 * @return string
 */
BanWordService.prototype.randCensor = function (chars, len) {
  function shuffle (string) {
    var parts = string.split('')
    for (var i = parts.length; i > 0;) {
      var random = parseInt(Math.random() * i)
      var temp = parts[--i]
      parts[i] = parts[random]
      parts[random] = temp
    }
    return parts.join('')
  }
  return shuffle(
    chars.repeat(len / chars.length) +
    chars.substr(0, len % chars.length)
  )
}

/**
 * Copy paste from internet to mimic str_ireplace php function
 */
BanWordService.prototype.strIreplace = function (search, replace, subject, count) {
  var i = 0
  var j = 0
  var temp = ''
  var repl = ''
  var sl = 0
  var fl = 0
  var f = ''
  var r = ''
  var s = ''
  var ra = ''
  var otemp = ''
  var oi = ''
  var ofjl = ''
  var os = subject
  var osa = Object.prototype.toString.call(os) === '[object Array]'

  if (typeof (search) === 'object') {
    temp = search
    search = []
    for (i = 0; i < temp.length; i += 1) {
      search[i] = temp[i].toLowerCase()
    }
  } else { search = search.toLowerCase() }

  if (typeof (subject) === 'object') {
    temp = subject
    subject = []
    for (i = 0; i < temp.length; i += 1) {
      subject[i] = temp[i].toLowerCase()
    }
  } else { subject = subject.toLowerCase() }

  if (typeof (search) === 'object' && typeof (replace) === 'string') {
    temp = replace
    replace = []
    for (i = 0; i < search.length; i += 1) {
      replace[i] = temp
    }
  }
  temp = ''
  f = [].concat(search)
  r = [].concat(replace)
  ra = Object.prototype.toString.call(r) === '[object Array]'
  s = subject
  s = [].concat(s)
  os = [].concat(os)

  if (count) {
    this.window[count] = 0
  }

  for (i = 0, sl = s.length; i < sl; i++) {
    if (s[i] === '') {
      continue
    }
    for (j = 0, fl = f.length; j < fl; j++) {
      temp = s[i] + ''
      repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0]
      s[i] = (temp).split(f[j]).join(repl)
      otemp = os[i] + ''
      oi = temp.indexOf(f[j])
      ofjl = f[j].length
      if (oi >= 0) {
        os[i] = (otemp).split(otemp.substr(oi, ofjl)).join(repl)
      }

      if (count) {
        this.window[count] += ((temp.split(f[j])).length - 1)
      }
    }
  }
  return osa ? os : os[0]
}

/**
 * Generates the regular expressions that are going to be used to check for profanity
 *
 * @param boolean $fullWords Option to generate regular expressions used for full words instead. Default is false
 */
BanWordService.prototype.generateCensorChecks = function (fullWords = false) {
  let badwords = this.badwords
  // generate censor checks as soon as we load the dictionary
  // utilize leet equivalents as well
  let leetReplace = {}
  leetReplace['a'] = '(a|a.|a-|4|@|Á|á|À|Â|à|Â|â|Ä|ä|Ã|ã|Å|å|α|Δ|Λ|λ)'
  leetReplace['b'] = '(b|b.|b-|8||3|ß|Β|β)'
  leetReplace['c'] = '(c|c.|c-|Ç|ç|¢|€|<|\\(|{|©)'
  leetReplace['d'] = '(d|d.|d-|&part;||\\)|Þ|þ|Ð|ð)'
  leetReplace['e'] = '(e|e.|e-|3|€|È|è|É|é|Ê|ê|∑)'
  leetReplace['f'] = '(f|f.|f-|ƒ)'
  leetReplace['g'] = '(g|g.|g-|6|9)'
  leetReplace['h'] = '(h|h.|h-|Η)'
  leetReplace['i'] = '(i|i.|i-|!|\\||][|]|1|∫|Ì|Í|Î|Ï|ì|í|î|ï)'
  leetReplace['j'] = '(j|j.|j-)'
  leetReplace['k'] = '(k|k.|k-|Κ|κ)'
  leetReplace['l'] = '(l|1.|l-|!|\\||][|]|£|∫|Ì|Í|Î|Ï)'
  leetReplace['m'] = '(m|m.|m-)'
  leetReplace['n'] = '(n|n.|n-|η|Ν|Π)'
  leetReplace['o'] = '(o|o.|o-|0|Ο|ο|Φ|¤|°|ø)'
  leetReplace['p'] = '(p|p.|p-|ρ|Ρ|¶|þ)'
  leetReplace['q'] = '(q|q.|q-)'
  leetReplace['r'] = '(r|r.|r-|®)'
  leetReplace['s'] = '(s|s.|s-|5|$|§)'
  leetReplace['t'] = '(t|t.|t-|Τ|τ|7)'
  leetReplace['u'] = '(u|u.|u-|υ|µ)'
  leetReplace['v'] = '(v|v.|v-|υ|ν)'
  leetReplace['w'] = '(w|w.|w-|ω|ψ|Ψ)'
  leetReplace['x'] = '(x|x.|x-|Χ|χ)'
  leetReplace['y'] = '(y|y.|y-|¥|γ|ÿ|ý|Ÿ|Ý)'
  leetReplace['z'] = '(z|z.|z-|Ζ)'

  let censorChecks = {}
  var x
  var xMax
  for (x = 0, xMax = badwords.length; x < xMax; x++) {
    censorChecks[x] = fullWords
      ? new RegExp('\\b' + this.strIreplace(Object.keys(leetReplace), Object.values(leetReplace), badwords[x]) + '\\b', 'i')
      : new RegExp(this.strIreplace(Object.keys(leetReplace), Object.values(leetReplace), badwords[x]), 'i')
  }

  this.censorChecks = censorChecks
}

/**
 *  Apply censorship to $string, replacing badwords with $censorChar.
 *
 * @param string string String to be censored.
 * @param bool  fullWords Option to censor by word only.
 *
 * @return array
 */
BanWordService.prototype.censorString = function (string, fullWords = false) {
  // generate our censor checks if they are not defined yet
  if (!this.censorChecks) {
    this.generateCensorChecks(fullWords)
  }

  let self = this
  let counter = 0
  let match = {}
  let newstring = {}
  newstring.orig = decodeEntities(string)
  let original = this.replaceWhiteListed(newstring.orig)

  newstring.clean = original
  Object.keys(this.censorChecks).forEach(patternKey => {
    newstring.clean = newstring.clean.replace(
      self.censorChecks[patternKey],
      (matches) => {
        match[counter++] = matches
        // is self.replacer a single char?
        return (self.replacer.length === 1)
          ? self.replacer.repeat(matches.length)
          : self.randCensor(self.replacer, matches.length)
      }
    )
  })
  newstring.clean = this.replaceWhiteListed(newstring.clean, true)
  newstring.matched = match

  return newstring
}

// Export the class
export default BanWordService
