import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { ChatSelfEfficacyDto } from '../dto/update-chat.dto';
import { OperatorForChat } from '../enums/operators-for-chat.enum';
import { EDrugFrequency, EDrugRegularity, EDrugType } from '../enums/drug.enum';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  shortKey: string;

  @Prop({ required: true })
  twinChatKey: string;

  @Prop({ required: true })
  sequenceNumber: number;

  @Prop({ default: '' })
  operatorId: string;

  @Prop({ default: '' })
  assistantId: string;

  @Prop({ required: true })
  type: OperatorForChat;

  @Prop()
  doctorId: string;

  @Prop({ required: true })
  clientNumber: string;

  @Prop({ required: true })
  dummyName: string;

  @Prop({ type: Object, default: { recommended: 0, current: 0 } })
  weight: { recommended: number; current: number };

  @Prop({ default: 0 })
  height: number;

  // Additional props for Kirill
  @Prop({ default: '' })
  lifestyleAssessment: string;

  @Prop({ default: '' })
  generalHealthRisks: string;

  @Prop({ default: '' })
  score: string;

  @Prop({ default: '' })
  bipq: string;

  @Prop({ default: '' })
  food: string;

  @Prop({ default: '' })
  stress: string;

  @Prop({ default: '' })
  sleep: string;

  @Prop({ default: '' })
  sport: string;

  @Prop({ default: '' })
  badHabits: string;

  @Prop({ default: '' })
  understanding: string;

  @Prop({ default: '' })
  measurementErrors: string;

  @Prop({ default: '' })
  eysenck1: string;

  @Prop({ default: '' })
  eysenck2: string;

  @Prop({ default: '' })
  eysenck3: string;

  @Prop({ default: '' })
  eysenck4: string;

  @Prop({ type: Object })
  personalInfo: {
    clientName: string;
    sex: string;
    dateOfBirth: Date;
    age: string;
    nation: string;
    city: string;
    familyStatus: string;
    livesWith: string;
    levelOfEducation: string;
    jobProfession: string;
    jobDescription: string[];
  };

  @Prop()
  bmi: number;

  @Prop()
  drugs: Array<{
    id: string;
    name: string;
    type: EDrugType;
    dosage: string;
    regularity: {
      value: EDrugRegularity;
      additional: string;
    };
    frequency: {
      value: EDrugFrequency;
      additional: string;
    };
    indication: string;
  }>;

  @Prop()
  habits: Array<{
    id: string;
    name: string;
    repeatability: number;
    limit: number;
  }>;

  @Prop()
  testResults: Array<{
    id: string;
    name: string;
    text: string;
  }>;

  @Prop()
  recommendations: Array<{
    id: string;
    name: string;
    min: number;
  }>;

  @Prop({ type: Object })
  diseases: {
    cardiovascularDiseases: string[];
    relativeDiseases: string[];
    chronicDiseases: string[];
    otherDiseases: string;
  };

  @Prop()
  additionalInformation: string;

  @Prop({ type: Object, default: {} })
  kit: {
    id: string;
    fillingSuccess: Array<{ date: string; value: number; total: number }>;
  };

  @Prop({ required: true, default: 0 })
  checkinsPerWeek: number;

  @Prop({ required: true, default: 0 })
  assistantCheckinsPerWeek: number;

  @Prop({ type: Object, default: { norm: 0, current: 0, previous: 0 } })
  selfEfficacy: ChatSelfEfficacyDto;

  @Prop({
    type: Object,
    default: {
      recommended: { sys: 0, dia: 0 },
      comfortable: { sys: 0, dia: 0 },
    },
  })
  bloodPressure: {
    recommended: {
      sys: number;
      dia: number;
    };
    comfortable: {
      sys: number;
      dia: number;
    };
  };

  @Prop({
    type: Object,
    default: { recommended: 0, comfortable: 0 },
  })
  heartRate: { recommended: number; comfortable: number };

  @Prop({ default: true })
  active: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
