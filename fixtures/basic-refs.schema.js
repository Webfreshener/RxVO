export default {
  $id: "root",
  type: "object",
  definitions: {
    refA: {
      type: "object",
      properties: {
        valueA: {
          type: "string"
        }
      }
    },
    refB: {
      type: "object",
      properties: {
        valueB: {
          type: "integer"
        }
      }
    },
    refC: {
      type: "array",
      items: {
          type: "string"
      }
    }
  },
  properties: {
    aReference: {
      $ref: "#/definitions/refA"
    },
    bReference: {
      $ref: "#/definitions/refB"
    },
    cReference: {
      $ref: "#/definitions/refC"
    }
  }
};
