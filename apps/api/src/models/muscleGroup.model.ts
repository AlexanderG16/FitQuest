import mongoose, { type Document, Schema } from "mongoose";

export interface IMuscleGroup extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const muscleGroupSchema = new Schema<IMuscleGroup>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 1,
            maxlength: 100,
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret: Record<string, unknown>) {
                ret['id'] = String(ret['_id']);
                delete ret['_id'];
                delete ret['__v'];
                return ret;
            }
        }
    }
);

export const MuscleGroupModel = mongoose.model<IMuscleGroup>('Muscle Group', muscleGroupSchema)