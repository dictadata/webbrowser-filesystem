/**
 * scraper/encoder
 * 
 * Utility methods for fundamental type conversion and encoding/decoding.
 */
"use strict";

/**
 * Convert a scraper fundamental data type to a dictadata storage type.
 * Returns an array with [storageType,size]
 */
var storageType = exports.storageType = function (scraperType) {
  let rstype = '';
  let rssize = '';

  // format is usually "name(size)" e.g. "int(11)"
  let found = false;
  for (let i = 0; i < scraperType.length; i++) {
    if (scraperType[i] === '(')
      found = true;
    else if (scraperType[i] === ')')
      break;
    else if (!found)
      rstype += scraperType[i];
    else
      rssize += scraperType[i];
  }

  let size = parseInt(rssize);

  // convert to storage type
  let fldType = 'undefined';
  switch (rstype.toUpperCase()) {
    case 'SMALLINT':
    case 'INT2':
    case 'INTEGER':
    case 'INT':
    case 'INT4':
      fldType = 'integer';
      break;

    case 'REAL':
    case 'FLOAT4':
    case 'DOUBLE PRECISION':
    case 'FLOAT':
    case 'FLOAT8':
      fldType = 'float';
      break;

    case 'BOOLEAN':
    case 'BOOL':
      fldType = 'boolean';
      break;

    case 'CHAR':
    case 'CHARACTER':
    case 'NCHAR':
    case 'BPCHAR':
    case 'VARCHAR':
    case 'CHARACTER VARYING':
    case 'NVARCHAR':
    case 'TEXT':
    case 'DECIMAL':  // odd balls
    case 'NUMERIC':
    case 'BIGINT':
    case 'INT8':
      fldType = 'text';
      break;

    case 'DATE':
    case 'TIMESTAMP':
    case 'TIMESTAMP WITHOUT TIME ZONE':
    case 'TIMESTAMPTZ':
    case 'TIMESTAMP WITH TIME ZONE':
      fldType = 'date';
      break;

  }

  return [fldType, size];
};

/**
 * Convert a dictadata field's storage type to a scraper fundamental data type.
 * Returns a scraper fundamental data type.
 */
exports.scraperType = function (field) {
  let scraperType = "VARCHAR(32)";

  if (field._model_scraper) {
    scraperType = field._model_scraper.Type;
  }
  else {
    switch (field.type) {
      case "boolean":
        scraperType ="BOOL";
        break;
      case "integer":
        scraperType ="INT";
        break;
      case "float":
        scraperType ="FLOAT";
        break;
      case "keyword":
        scraperType ="VARCHAR(" + (field.size || 64) + ")";
        break;
      case "text":
        scraperType ="VARCHAR(" + (field.size || 1024) + ")";
        break;
      case "date":
        scraperType ="DATE";
        break;
    }
  }

  return scraperType;
};

/**
 * Convert a scraper field|column|attribute to a dictadata storage field definition.
 * Returns a new datastore field object.
 */
exports.storageField = function (column) {

  let [fldType,size] = storageType(column.TYPE_NAME);

  let field = {
    name: column.COLUMN_NAME,
    type: fldType,
    size: size || column.COLUMN_SIZE,
    default: column.COLUMN_DEF || null,
    isNullable: column.NULLABLE || false,
    isKey: false,

    // add additional Scraper fields as _model_ meta data
    _model_scraper: {
      TYPE_NAME: column.TYPE_NAME,
      REMARKS: column.REMARKS
    }
  };

  return field;
};
